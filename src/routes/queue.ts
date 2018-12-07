/// <reference path="../../typings.d.ts" />
import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as moment from 'moment';
const request = require('request')

import { QueueModel } from '../models/queue';
import { HiModel } from '../models/his/hi';
import { HosxpModel } from '../models/his/hosxp';
import { EzhospModel } from './../models/his/ezhosp';
import { ServicePointModel } from '../models/service_point';
import { PriorityModel } from '../models/priority';

const queueModel = new QueueModel();
const servicePointModel = new ServicePointModel();
const priorityModel = new PriorityModel();

// var hisModel = process.env.HIS_TYPE === 'hi' ? new HiModel : new HosxpModel(); // other model here.
var hisModel: any;

switch (process.env.HIS_TYPE) {
  case 'hi':
    hisModel = new HiModel();
    break;
  case 'ezhosp':
    hisModel = new EzhospModel();
    break;
  default:
    hisModel = new HosxpModel();
    break;
}

const router = (fastify, { }, next) => {

  var dbHIS: Knex = fastify.dbHIS;
  var db: Knex = fastify.db;

  var padStart = function padStart(str, targetLength, padString = '0') {
    targetLength = targetLength >> 0;
    if (str.length >= targetLength) {
      return str;
    } else {
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + str;
    }
  };

  fastify.get('/his-visit', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const limit = +req.query.limit;
    const offset = +req.query.offset;
    const servicePointCode: any = req.query.servicePointCode || '';
    const query: any = req.query.query || '';

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');
      const rsLocalCode: any = await servicePointModel.getLocalCode(db);
      const rsCurrentOnQueue: any = await queueModel.getCurrentVisitOnQueue(db, dateServ);

      var localCodes: any = [];
      var vn: any = [];

      rsLocalCode.forEach(v => {
        localCodes.push(v.local_code);
      });

      rsCurrentOnQueue.forEach(v => {
        vn.push(v.vn);
      });

      const rsTotal: any = await hisModel.getVisitTotal(dbHIS, dateServ, localCodes, vn, servicePointCode, query);
      const rs: any = await hisModel.getVisitList(dbHIS, dateServ, localCodes, vn, servicePointCode, query, limit, offset);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs, total: rsTotal[0].total })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/register', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const hn = req.body.hn;
    const vn = req.body.vn;
    const localCode = req.body.clinicCode;
    const priorityId = req.body.priorityId;
    const dateServ = req.body.dateServ;
    const timeServ = req.body.timeServ;
    const hisQueue = req.body.hisQueue;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const title = req.body.title;
    const birthDate = req.body.birthDate;
    const sex = req.body.sex;

    if (hn && vn && localCode && dateServ && timeServ && firstName && lastName && birthDate) {
      try {
        // get service point id from mapping
        const rsLocalCode: any = await servicePointModel.getServicePointIdFromLocalCode(db, localCode);
        const servicePointId = rsLocalCode[0].service_point_id;

        if (servicePointId) {

          // get prefix
          const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
          const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
          const rsPointPrefix: any = await servicePointModel.getPrefix(db, servicePointId);
          const prefixPoint: any = rsPointPrefix[0].prefix || '0';

          const rsDup: any = await queueModel.checkDuplicatedQueue(db, hn, vn, servicePointId);
          if (rsDup[0].total > 0) {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ข้อมูลการรับบริการซ้ำ' })
          } else {
            await queueModel.savePatient(db, hn, title, firstName, lastName, birthDate, sex);
            var queueNumber = 0;
            var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);

            if (rs1.length) {
              queueNumber = rs1[0]['current_queue'] + 1;
              await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
            } else {
              queueNumber = 1;
              await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
            }

            const queueDigit = +process.env.QUEUE_DIGIT || 3;
            const _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');

            const strQueueNumber: string = `${prefixPoint}${prefixPriority}${_queueNumber}`;
            const dateCreate = moment().format('YYYY-MM-DD HH:mm:ss');

            const qData: any = {};
            qData.servicePointId = servicePointId;
            qData.dateServ = dateServ;
            qData.timeServ = timeServ;
            qData.queueNumber = strQueueNumber;
            qData.hn = hn;
            qData.vn = vn;
            qData.priorityId = priorityId;
            qData.dateCreate = dateCreate;
            qData.hisQueue = hisQueue;

            const queueId: any = await queueModel.createQueueInfo(db, qData);

            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, hn: hn, vn: vn, queueNumber: queueNumber, queueId: queueId[0] });

            const topic = process.env.QUEUE_CENTER_TOPIC;
            fastify.mqttClient.publish(topic, 'update visit');

          }

        } else {
          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบรหัสแผนกที่ต้องการ' })
        }

      } catch (error) {
        fastify.log.error(error);
        reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
      }

    } else {
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ข้อมูลไม่ครบ' })
    }
  })

  fastify.get('/waiting/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const servicePointId = req.params.servicePointId;
    const limit = +req.query.limit || 20;
    const offset = +req.query.offset || 0;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      const rs: any = await queueModel.getWaitingList(db, dateServ, servicePointId, limit, offset);
      const rsTotal: any = await queueModel.getWaitingListTotal(db, dateServ, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs, total: rsTotal[0].total })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/working/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const servicePointId = req.params.servicePointId;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      const rs: any = await queueModel.getWorking(db, dateServ, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/pending/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const servicePointId = req.params.servicePointId;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      const rs: any = await queueModel.getPending(db, dateServ, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/pending', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.body.queueId;
    const servicePointId = req.body.servicePointId;

    try {
      await queueModel.markPending(db, queueId, servicePointId);
      // get queue info
      const rsInfo: any = await queueModel.getDuplicatedQueueInfo(db, queueId);
      if (rsInfo) {

        const priorityId = rsInfo[0].priority_id;
        const hn = rsInfo[0].hn;
        const vn = rsInfo[0].vn;
        const hisQueue = rsInfo[0].his_queue;
        const timeServ = rsInfo[0].time_serv;
        const dateServ = moment(rsInfo[0].date_serv).format('YYYY-MM-DD');

        const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
        const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
        const rsPointPrefix: any = await servicePointModel.getPrefix(db, servicePointId);
        const prefixPoint: any = rsPointPrefix[0].prefix || '0';

        var queueNumber = 0;
        var strQueueNumber = null;
        var newQueueId = null;

        var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);

        if (rs1.length) {
          queueNumber = rs1[0]['current_queue'] + 1;
          await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
        } else {
          queueNumber = 1;
          await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
        }

        const queueDigit = +process.env.QUEUE_DIGIT || 3;
        const _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');

        strQueueNumber = `${prefixPoint}${prefixPriority}${_queueNumber}`;
        const dateCreate = moment().format('YYYY-MM-DD HH:mm:ss');

        const qData: any = {};
        qData.servicePointId = servicePointId;
        qData.dateServ = dateServ;
        qData.timeServ = timeServ;
        qData.queueNumber = strQueueNumber;
        qData.hn = hn;
        qData.vn = vn;
        qData.priorityId = priorityId;
        qData.dateCreate = dateCreate;
        qData.hisQueue = hisQueue;

        newQueueId = await queueModel.createQueueInfo(db, qData);

      }

      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: strQueueNumber, queueId: newQueueId[0] });

      const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;
      fastify.mqttClient.publish(servicePointTopic, 'update visit');

    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/caller/:queueId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.params.queueId;
    const servicePointId = req.body.servicePointId;
    const roomId = req.body.roomId;
    const roomNumber = req.body.roomNumber;
    const queueNumber = req.body.queueNumber;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      await queueModel.setQueueRoomNumber(db, queueId, roomId);
      await queueModel.removeCurrentQueue(db, servicePointId, dateServ, queueId);
      await queueModel.updateCurrentQueue(db, servicePointId, dateServ, queueId, roomId);
      await queueModel.markUnPending(db, queueId);
      const rsQueue: any = await queueModel.getResponseQueueInfo(db, queueId);
      // Send notify to H4U Server
      // 
      if (process.env.ENABLE_Q4U.toUpperCase() === 'Y') {

        // console.log(rsQueue[0]);
        if (rsQueue[0].length) {
          const data = rsQueue[0][0];
          console.log(process.env.Q4U_NOTIFY_URL);

          // queue without prefix
          const prefixLength = 2;
          const digiLength = +process.env.QUEUE_DIGIT || 3;
          const totalLength = prefixLength + digiLength;

          const queueWithoutPrefix = +queueNumber.substring(prefixLength, totalLength);

          const params = {
            hosid: data.hosid,
            servicePointCode: data.service_point_code,
            queueNumber: data.queue_number,
            queueWithoutPrefix: queueWithoutPrefix,
            roomNumber: data.room_number,
            token: process.env.Q4U_NOTIFY_TOKEN,
            roomName: data.room_name,
            dateServ: moment(data.date_serv).format('YYYYMMDD'),
          };

          console.log(params);

          request.post(process.env.Q4U_NOTIFY_URL, {
            form: params
          }, (err, res, body) => {
            if (err) console.log(err);
            console.log(body);
          });

        }

      }

      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK });

      // publish mqtt
      const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;

      const globalTopic = process.env.QUEUE_CENTER_TOPIC;
      fastify.mqttClient.publish(globalTopic, 'update visit');

      const payload = {
        queueNumber: queueNumber,
        roomNumber: roomNumber,
        servicePointId: servicePointId
      }

      fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload));

    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/change-room', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.body.queueId;
    const roomId = req.body.roomId;
    const roomNumber = req.body.roomNumber;
    const queueNumber = req.body.queueNumber;

    const servicePointId = req.body.servicePointId;

    const dateServ = moment().format('YYYY-MM-DD');

    try {
      await queueModel.setQueueRoomNumber(db, queueId, roomId);
      await queueModel.removeCurrentQueue(db, servicePointId, dateServ, queueId);
      await queueModel.changeCurrentQueue(db, servicePointId, dateServ, queueId, roomId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })

      const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;

      const payload = {
        queueNumber: queueNumber,
        roomNumber: roomNumber,
        servicePointId: servicePointId
      }

      fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload));

    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/current-list', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const currentDate = moment().format('YYYY-MM-DD');
    try {
      const rs: any = await queueModel.getCurrentQueueList(db, currentDate);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs[0] })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;