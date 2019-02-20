/// <reference path="../../typings.d.ts" />
import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as moment from 'moment';
const request = require('request')

import { QueueModel } from '../models/queue';
import { EzhospModel } from '../models/his/ezhosp';
import { HiModel } from '../models/his/hi';
import { HosxpModel } from '../models/his/hosxp';
import { UniversalModel } from '../models/his/universal';
import { HomcModel } from '../models/his/homc';
// import { HimproModel } from '../models/his/himpro';
import { ServicePointModel } from '../models/service_point';
import { PriorityModel } from '../models/priority';

const queueModel = new QueueModel();
const servicePointModel = new ServicePointModel();
const priorityModel = new PriorityModel();
const hisType = process.env.HIS_TYPE || 'universal';

// ห้ามแก้ไข // 

var hisModel: any;
switch (hisType) {
  case 'ezhosp':
    hisModel = new EzhospModel();
    break;
  case 'hosxp':
    hisModel = new HosxpModel();
    break;
  case 'hi':
    hisModel = new HiModel();
    break;
  case 'homc':
    hisModel = new HomcModel();
    break;
  case 'universal':
    hisModel = new UniversalModel();
    break;
  default:
    hisModel = new HosxpModel();
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

  fastify.get('/test', async (req: fastify.Request, reply: fastify.Reply) => {
    try {
      const rs: any = await hisModel.testConnection(dbHIS);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: 'Welcome to Q4U!' })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/patient/info', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    var cid = req.body.cid;

    if (cid) {
      try {
        const rs: any = await hisModel.getPatientInfo(dbHIS, cid);
        if (rs.length) {
          var data = rs[0];
          var hn = data.hn;
          var firstName = data.first_name;
          var lastName = data.last_name;
          var birthDate = data.birthdate;
          var title = data.title;
          var sex = data.sex;

          var thDate = `${moment(birthDate).format('DD/MM')}/${moment(birthDate).get('year') + 543}`;
          var patient = {
            hn: hn,
            firstName: firstName,
            lastName: lastName,
            birthDate: thDate,
            engBirthDate: moment(birthDate).format('YYYY-MM-DD'),
            title: title,
            sex: sex
          };

          console.log(patient);

          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: patient })

        } else {
          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.NOT_FOUND, message: 'ไม่พบข้อมูล' });
        }
      } catch (error) {
        fastify.log.error(error);
        reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message })
      }
    } else {
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.NOT_FOUND, message: 'CID not found!' })
    }

  })

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
        const servicePointId = rsLocalCode.length ? rsLocalCode[0].service_point_id : null;

        if (servicePointId) {

          // get prefix
          const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
          const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
          const rsPointPrefix: any = await servicePointModel.getPrefix(db, servicePointId);
          const prefixPoint: any = rsPointPrefix[0].prefix || '0';

          await queueModel.savePatient(db, hn, title, firstName, lastName, birthDate, sex);
          var queueNumber = 0;
          var queueInterview = 0;

          var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
          var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

          // queue number
          if (rs1.length) {
            queueNumber = rs1[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
          } else {
            queueNumber = 1;
            await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
          }
          // queue interview
          if (rs2.length) {
            queueInterview = rs2[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, 999, dateServ);
          } else {
            queueInterview = 1;
            await queueModel.createServicePointQueueNumber(db, 999, dateServ);
          }

          const _queueRunning = queueNumber;

          const queueDigit = +process.env.QUEUE_DIGIT || 3;
          var _queueNumber = null;

          if (process.env.ZERO_PADDING === 'Y') {
            _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');
          } else {
            _queueNumber = queueNumber.toString();
          }

          var strQueueNumber: string = null;

          if (process.env.USE_PRIORITY_PREFIX === 'Y') {
            strQueueNumber = `${prefixPoint}${prefixPriority} ${_queueNumber}`;
          } else {
            strQueueNumber = `${prefixPoint} ${_queueNumber}`;
          }

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
          qData.queueRunning = _queueRunning;
          qData.queueInterview = queueInterview;

          const queueId: any = await queueModel.createQueueInfo(db, qData);

          const topic = process.env.QUEUE_CENTER_TOPIC;
          const topicServicePoint = `${topic}/${servicePointId}`;

          fastify.mqttClient.publish(topic, 'update visit');
          fastify.mqttClient.publish(topicServicePoint, 'update visit');

          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, hn: hn, vn: vn, queueNumber: queueNumber, queueId: queueId[0] });

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

  fastify.post('/prepare/register', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const hn = req.body.hn;
    const servicePointId = req.body.servicePointId;
    const priorityId = req.body.priorityId;

    if (hn) {
      // get patient info
      var rsp: any = await hisModel.getPatientInfoWithHN(dbHIS, hn);

      if (rsp.length) {
        const vn = moment().format('x');
        const dateServ = moment().format('YYYY-MM-DD');
        const timeServ = moment().format('HH:mm:ss');
        const hisQueue = null;
        const firstName = rsp[0].first_name;
        const lastName = rsp[0].last_name;
        const title = rsp[0].title;
        const birthDate = moment(rsp[0].birthdate).format('YYYY-MM-DD');
        const sex = rsp[0].sex;

        if (hn && vn && dateServ && timeServ && firstName && lastName && birthDate) {
          try {
            if (servicePointId) {
              // get prefix
              const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
              const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
              const rsPointPrefix: any = await servicePointModel.getPrefix(db, servicePointId);
              const prefixPoint: any = rsPointPrefix[0].prefix || '0';

              await queueModel.savePatient(db, hn, title, firstName, lastName, birthDate, sex);
              var queueNumber = 0;
              var queueInterview = 0;

              var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
              var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

              // queue number
              if (rs1.length) {
                queueNumber = rs1[0]['current_queue'] + 1;
                await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
              } else {
                queueNumber = 1;
                await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
              }
              // queue interview
              if (rs2.length) {
                queueInterview = rs2[0]['current_queue'] + 1;
                await queueModel.updateServicePointQueueNumber(db, 999, dateServ);
              } else {
                queueInterview = 1;
                await queueModel.createServicePointQueueNumber(db, 999, dateServ);
              }

              const _queueRunning = queueNumber;

              const queueDigit = +process.env.QUEUE_DIGIT || 3;
              var _queueNumber = null;

              if (process.env.ZERO_PADDING === 'Y') {
                _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');
              } else {
                _queueNumber = queueNumber.toString();
              }

              var strQueueNumber: string = null;

              if (process.env.USE_PRIORITY_PREFIX === 'Y') {
                strQueueNumber = `${prefixPoint}${prefixPriority} ${_queueNumber}`;
              } else {
                strQueueNumber = `${prefixPoint} ${_queueNumber}`;
              }

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
              qData.queueRunning = _queueRunning;
              qData.queueInterview = queueInterview;

              const queueId: any = await queueModel.createQueueInfo(db, qData);

              const topic = process.env.QUEUE_CENTER_TOPIC;
              const topicServicePoint = `${topic}/${servicePointId}`;

              fastify.mqttClient.publish(topic, 'update visit');
              fastify.mqttClient.publish(topicServicePoint, 'update visit');

              reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, hn: hn, vn: vn, queueNumber: queueNumber, queueId: queueId[0] });

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

      } else {
        reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'ไม่พบข้อมูล'
          })
      }
    } else {
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'ไม่ HN'
        })
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

  fastify.get('/all-queue/active', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');
      const rs: any = await queueModel.getAllQueueActive(db, dateServ);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/working/history/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const servicePointId = req.params.servicePointId;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      const rs: any = await queueModel.getWorkingHistory(db, dateServ, servicePointId);
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

  fastify.put('/interview/marked/:queueId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.params.queueId;

    try {
      await queueModel.markInterview(db, queueId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/pending', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.body.queueId;
    const servicePointId = req.body.servicePointId;
    const priorityId = req.body.priorityId;

    try {
      await queueModel.markPending(db, queueId, servicePointId);
      // get queue info
      const rsInfo: any = await queueModel.getDuplicatedQueueInfo(db, queueId);
      if (rsInfo) {
        // const priorityId = rsInfo[0].priority_id;
        const hn = rsInfo[0].hn;
        const vn = rsInfo[0].vn;
        const hisQueue = rsInfo[0].his_queue;
        const timeServ = rsInfo[0].time_serv;
        const dateServ = moment(rsInfo[0].date_serv).format('YYYY-MM-DD');

        const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
        const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
        const rsServicePoint: any = await servicePointModel.getPrefix(db, servicePointId);
        const prefixPoint: any = rsServicePoint[0].prefix || '0';

        const useOldQueue: any = rsServicePoint[0].use_old_queue || 'N';

        if (useOldQueue === 'Y') {
          var queueNumber = 0;
          var newQueueId = null;
          var queueInterview = 0;

          var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
          var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

          if (rs1.length) {
            queueNumber = rs1[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
          } else {
            queueNumber = 1;
            await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
          }

          // queue interview
          if (rs2.length) {
            queueInterview = rs2[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, 999, dateServ);
          } else {
            queueInterview = 1;
            await queueModel.createServicePointQueueNumber(db, 999, dateServ);
          }

          const _queueRunning = queueNumber;
          const strQueueNumber = rsInfo[0].queue_number;

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
          qData.queueRunning = _queueRunning;
          qData.queueInterview = queueInterview;

          newQueueId = await queueModel.createQueueInfo(db, qData);

          const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;
          const topic = process.env.QUEUE_CENTER_TOPIC;

          fastify.mqttClient.publish(servicePointTopic, 'update visit');
          fastify.mqttClient.publish(topic, 'update visit');

          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: strQueueNumber, queueId: newQueueId[0] });

        } else {
          var queueNumber = 0;
          var strQueueNumber = null;
          var newQueueId = null;
          var queueInterview = 0;

          var rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
          var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

          if (rs1.length) {
            queueNumber = rs1[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
          } else {
            queueNumber = 1;
            await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
          }

          // queue interview
          if (rs2.length) {
            queueInterview = rs2[0]['current_queue'] + 1;
            await queueModel.updateServicePointQueueNumber(db, 999, dateServ);
          } else {
            queueInterview = 1;
            await queueModel.createServicePointQueueNumber(db, 999, dateServ);
          }

          const _queueRunning = queueNumber;

          const queueDigit = +process.env.QUEUE_DIGIT || 3;
          // const _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');

          var _queueNumber = null;

          if (process.env.ZERO_PADDING === 'Y') {
            _queueNumber = padStart(queueNumber.toString(), queueDigit, '0');
          } else {
            _queueNumber = queueNumber.toString();
          }

          if (process.env.USE_PRIORITY_PREFIX === 'Y') {
            strQueueNumber = `${prefixPoint}${prefixPriority} ${_queueNumber}`;
          } else {
            strQueueNumber = `${prefixPoint} ${_queueNumber}`;
          }

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
          qData.queueRunning = _queueRunning;
          qData.queueInterview = queueInterview;

          newQueueId = await queueModel.createQueueInfo(db, qData);

          const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;
          const topic = process.env.QUEUE_CENTER_TOPIC;

          fastify.mqttClient.publish(servicePointTopic, 'update visit');
          fastify.mqttClient.publish(topic, 'update visit');

          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: strQueueNumber, queueId: newQueueId[0] });

        }

      }
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
    const isCompleted = req.body.isCompleted;

    try {
      const dateServ: any = moment().format('YYYY-MM-DD');

      await queueModel.setQueueRoomNumber(db, queueId, roomId);
      await queueModel.removeCurrentQueue(db, servicePointId, dateServ, queueId);
      await queueModel.updateCurrentQueue(db, servicePointId, dateServ, queueId, roomId);
      await queueModel.markUnPending(db, queueId);
      if (isCompleted === 'N') {
        await queueModel.markInterview(db, queueId);
      } else {
        await queueModel.markCompleted(db, queueId);
      }

      // Send notify to H4U Server
      // 
      if (process.env.ENABLE_Q4U.toUpperCase() === 'Y') {
        const rsQueue: any = await queueModel.getResponseQueueInfo(db, queueId);
        // console.log(rsQueue[0]);
        if (rsQueue[0].length) {
          const data = rsQueue[0][0];
          const queueWithoutPrefix = +data.queue_running;

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

          request.post(process.env.Q4U_NOTIFY_URL, {
            form: params
          }, (err: any, res: any, body: any) => {
            if (err) console.log(err);
            console.log(body);
          });

        }

      }

      // publish mqtt
      const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;

      const globalTopic = process.env.QUEUE_CENTER_TOPIC;

      const payload = {
        queueNumber: queueNumber,
        roomNumber: roomNumber,
        servicePointId: servicePointId
      }

      fastify.mqttClient.publish(globalTopic, 'update visit');
      fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload));

      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK });

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
      await queueModel.updateCurrentQueue(db, servicePointId, dateServ, queueId, roomId);

      const servicePointTopic = process.env.SERVICE_POINT_TOPIC + '/' + servicePointId;

      const payload = {
        queueNumber: queueNumber,
        roomNumber: roomNumber,
        servicePointId: servicePointId
      }

      fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload));

      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })

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

  fastify.delete('/cancel/:queueId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.params.queueId;

    try {
      await queueModel.markCancel(db, queueId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;