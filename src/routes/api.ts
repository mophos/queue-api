/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as moment from 'moment';
import * as HttpStatus from 'http-status-codes';
const request = require('request')

import { QueueModel } from '../models/queue';
import { TokenModel } from '../models/token';
import { ServicePointModel } from '../models/service_point';
import { PriorityModel } from '../models/priority';

const queueModel = new QueueModel();
const servicePointModel = new ServicePointModel();
const priorityModel = new PriorityModel();

const tokenModel = new TokenModel();

const router = (fastify, { }, next) => {

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

  fastify.post('/register', async (req: fastify.Request, reply: fastify.Reply) => {
    const token = req.body.token;
    const hn = req.body.hn;
    const vn = req.body.vn;
    const localCode = req.body.clinicCode;
    const priorityId = req.body.priorityId;
    const dateServ = moment().format('YYYY-MM-DD');
    const timeServ = req.body.timeServ;
    const hisQueue = req.body.hisQueue;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const title = req.body.title;
    const birthDate = req.body.birthDate;
    const sex = req.body.sex;

    if (token) {
      if (hn && vn && localCode && dateServ && timeServ && firstName && lastName && birthDate) {
        try {
          const decoded = fastify.jwt.verify(token)
          // check token 
          const rsToken: any = await tokenModel.find(db, token);
          if (rsToken.length) {
            // get service point id from mapping
            const rsLocalCode: any = await servicePointModel.getServicePointIdFromLocalCode(db, localCode);
            const servicePointId = rsLocalCode[0].service_point_id;

            if (servicePointId) {

              // get prefix
              const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
              const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || 'T';
              const rsPointPrefix: any = await servicePointModel.getPrefix(db, servicePointId);
              const prefixPoint: any = rsPointPrefix[0].prefix || 'T';

              const usePriorityQueueRunning = rsPointPrefix[0].priority_queue_running || 'N';

              await queueModel.savePatient(db, hn, title, firstName, lastName, birthDate, sex);
              var queueNumber = 0;
              var queueInterview = 0;

              var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

              var rs1: any;

              if (usePriorityQueueRunning === 'Y') {
                rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ, priorityId);
              } else {
                rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
              }

              if (rs1.length) {
                queueNumber = rs1[0]['current_queue'] + 1;
                usePriorityQueueRunning === 'Y'
                  ? await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ, priorityId)
                  : await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
              } else {
                queueNumber = 1;
                usePriorityQueueRunning === 'Y'
                  ? await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ, priorityId)
                  : await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
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

              var strQueueNumber: string = null;

              if (process.env.USE_PRIORITY_PREFIX === 'Y') {
                strQueueNumber = `${prefixPoint}${prefixPriority} ${_queueNumber}`;
              } else {
                strQueueNumber = usePriorityQueueRunning === 'Y'
                  ? `${prefixPoint}${prefixPriority} ${_queueNumber}`
                  : `${prefixPoint} ${_queueNumber}`;
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

              var rsQueue: any = await queueModel.createQueueInfo(db, qData);
              var queueId = rsQueue[0];

              const rs: any = await queueModel.getPrintInfo(db, queueId);

              if (rs[0].length) {
                const info: any = rs[0][0];
                const hosname: any = info.hosname;
                const hosid: any = info.hosid;
                const queueNumber: any = info.queue_number;

                const queueWithoutPrefix = +info.queue_running;

                const servicePointName: any = info.service_point_name;
                // const remainQueue: any = info.remain_queue || 0;
                const hn: any = info.hn;
                const vn: any = info.vn;
                const priorityName: any = info.priority_name;
                const dateServ: any = moment(info.date_serv).format('YYYYMMDD');
                const timeServ: any = moment(info.time_serv, "HH:mm:ss").format('HHmm');
                // const dateCreated: any = moment(info.date_create).locale('th').format('DD/MM/YYYY HH:mm');
                const localCode: any = info.local_code;
                const qrcode = `${hosid}#${process.env.Q4U_NOTIFY_TOKEN}#${hn}#${localCode}#${queueNumber}#${queueWithoutPrefix}#${dateServ}#${timeServ}#${servicePointName}#${priorityName}`;

                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueId: queueId, hn: hn, vn: vn, queueNumber: queueNumber, qrcode: qrcode });

                const topic = process.env.QUEUE_CENTER_TOPIC;
                fastify.mqttClient.publish(topic, 'update visit', { qos: 0, retain: false });

              } else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.BAD_REQUEST, message: 'ไม่พบรหัสคิวที่ต้องการ' })
              }

            } else {
              reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบรหัสแผนกที่ต้องการ' })
            }
          } else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
          }

        } catch (error) {
          fastify.log.error(error);
          reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message })
        }

      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ข้อมูลไม่ครบ' })
      }
    } else {
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' })
    }

  });

  fastify.post('/call', async (req: fastify.Request, reply: fastify.Reply) => {

    const hn = req.body.hn;
    const servicePointId = req.body.servicePointId;
    const roomId = req.body.roomId;
    const token = req.body.token;
    const isInterview = req.body.isInterview || 'N';

    var departmentId = null;

    try {
      if (token) {
        if (hn && servicePointId && roomId) {
          fastify.jwt.verify(token)
          // check token 
          const rsToken: any = await tokenModel.find(db, token);
          if (rsToken.length) {
            var rs: any = await queueModel.apiGetCurrentQueueByHN(db, hn, servicePointId);
            if (rs.length) {
              var _queue = rs[0];

              const dateServ: any = moment().format('YYYY-MM-DD');

              const queueId = _queue.queue_id;
              const roomNumber = _queue.room_number;
              const queueNumber = _queue.queue_number;

              await queueModel.setQueueRoomNumber(db, queueId, roomId);
              await queueModel.removeCurrentQueue(db, servicePointId, dateServ, queueId);
              await queueModel.updateCurrentQueue(db, servicePointId, dateServ, queueId, roomId);
              await queueModel.markUnPending(db, queueId);

              await queueModel.markCompleted(db, queueId);
              var _queueIds: any = [];
              _queueIds.push(queueId);

              const rsQueue: any = await queueModel.getResponseQueueInfo(db, _queueIds);

              if (rsQueue.length) {
                departmentId = rsQueue[0].department_id;
              }

              // Send notify to H4U Server
              if (process.env.ENABLE_Q4U.toUpperCase() === 'Y') {

                if (rsQueue.length) {
                  const data = rsQueue[0];
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
              const departmentTopic = process.env.DEPARTMENT_TOPIC + '/' + departmentId;

              const globalTopic = process.env.QUEUE_CENTER_TOPIC;

              const payload = {
                queueNumber: queueNumber,
                roomNumber: roomNumber,
                servicePointId: servicePointId,
                departmentId: departmentId,
                isInterview: isInterview
              }

              if (rs.length) {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueId: rs[0].queue_id, priorityId: rs[0].priority_id });
              } else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK });
              }

              fastify.mqttClient.publish(departmentTopic, JSON.stringify(payload), { qos: 0, retain: false });
              fastify.mqttClient.publish(globalTopic, 'update visit', { qos: 0, retain: false });
              fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload), { qos: 0, retain: false });

            } else {
              reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send({
                  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                  message: 'ไม่พบคิวที่ต้องการ'
                });
            }
          } else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
          }
        } else {
          reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'ไม่พบ HN'
            });
        }
      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' })
      }

    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // get patient current queue
  fastify.get('/queue', async (req: fastify.Request, reply: fastify.Reply) => {
    const token = req.query.token;
    const hn = req.query.hn;

    if (token) {
      if (hn) {
        const decoded = fastify.jwt.verify(token)
        // check token 
        const rsToken: any = await tokenModel.find(db, token);
        if (rsToken.length) {
          try {
            const rs = await queueModel.getCurrentQueue(db, hn);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: rs[0].queue_number });
          } catch (error) {
            fastify.log.error(error);
            reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message })
          }
        } else {
          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
        }
      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ข้อมูลไม่ครบ' })
      }
    } else {
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' })
    }
  });

  fastify.post('/pending', async (req: fastify.Request, reply: fastify.Reply) => {

    const queueId = req.body.queueId;
    const servicePointId = req.body.servicePointId;
    const priorityId = req.body.priorityId;
    const token = req.body.token;

    if (token) {
      if (queueId && servicePointId && priorityId) {
        try {
          const decoded = fastify.jwt.verify(token)
          // check token 
          const rsToken: any = await tokenModel.find(db, token);

          if (rsToken.length) {
            await queueModel.markPending(db, queueId, servicePointId);
            // get queue info
            const rsInfo: any = await queueModel.getDuplicatedQueueInfo(db, queueId);
            if (rsInfo) {
              const hn = rsInfo[0].hn;
              const vn = rsInfo[0].vn;
              const hisQueue = rsInfo[0].his_queue;
              const timeServ = rsInfo[0].time_serv;
              const dateServ = moment(rsInfo[0].date_serv).format('YYYY-MM-DD');

              const rsPriorityPrefix: any = await priorityModel.getPrefix(db, priorityId);
              const prefixPriority: any = rsPriorityPrefix[0].priority_prefix || '0';
              const rsServicePoint: any = await servicePointModel.getPrefix(db, servicePointId);
              const prefixPoint: any = rsServicePoint[0].prefix || '0';
              const usePriorityQueueRunning = rsServicePoint[0].priority_queue_running || 'N';

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

                fastify.mqttClient.publish(servicePointTopic, 'update visit', { qos: 0, retain: false });
                fastify.mqttClient.publish(topic, 'update visit', { qos: 0, retain: false });

                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: strQueueNumber, queueId: newQueueId[0] });

              } else {
                var queueNumber = 0;
                var strQueueNumber = null;
                var newQueueId = null;
                var queueInterview = 0;

                var rs1: any;

                if (usePriorityQueueRunning === 'Y') {
                  rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ, priorityId);
                } else {
                  rs1 = await queueModel.checkServicePointQueueNumber(db, servicePointId, dateServ);
                }

                if (rs1.length) {
                  queueNumber = rs1[0]['current_queue'] + 1;
                  usePriorityQueueRunning === 'Y'
                    ? await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ, priorityId)
                    : await queueModel.updateServicePointQueueNumber(db, servicePointId, dateServ);
                } else {
                  queueNumber = 1;
                  usePriorityQueueRunning === 'Y'
                    ? await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ, priorityId)
                    : await queueModel.createServicePointQueueNumber(db, servicePointId, dateServ);
                }

                var rs2 = await queueModel.checkServicePointQueueNumber(db, 999, dateServ);

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
                  strQueueNumber = usePriorityQueueRunning === 'Y'
                    ? `${prefixPoint}${prefixPriority} ${_queueNumber}`
                    : `${prefixPoint} ${_queueNumber}`;
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

                fastify.mqttClient.publish(servicePointTopic, 'update visit', { qos: 0, retain: false });
                fastify.mqttClient.publish(topic, 'update visit', { qos: 0, retain: false });

                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueNumber: strQueueNumber, queueId: newQueueId[0] });

              }

            }
          } else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
          }
        } catch (error) {
          fastify.log.error(error);
          reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
        }
      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ข้อมูลไม่ครบ' })
      }
    } else {
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' })
    }
  });

  fastify.post('/caller', async (req: fastify.Request, reply: fastify.Reply) => {

    const hn = req.body.hn;
    const servicePointId = req.body.servicePointId;
    const roomId = req.body.roomId;
    const token = req.body.token;
    const isInterview = req.body.isInterview || 'N';
    try {
      if (token) {
        if (hn && servicePointId && roomId) {
          fastify.jwt.verify(token)
          // check token 
          const rsToken: any = await tokenModel.find(db, token);
          if (rsToken.length) {
            var rs: any = await queueModel.apiGetCurrentQueueByHN(db, hn, servicePointId);
            if (rs.length) {
              var _queue = rs[0];

              const dateServ: any = moment().format('YYYY-MM-DD');

              const queueId = _queue.queue_id;
              const queueNumber = _queue.queue_number;

              await queueModel.setQueueRoomNumber(db, queueId, roomId);
              await queueModel.removeCurrentQueue(db, servicePointId, dateServ, queueId);
              await queueModel.updateCurrentQueue(db, servicePointId, dateServ, queueId, roomId);
              // await queueModel.markUnPending(db, queueId);
              await queueModel.markCompleted(db, queueId);
              var _queueIds: any = [];
              _queueIds.push(queueId);

              const rsQueue: any = await queueModel.apiGetCurrentQueue(db, _queueIds);
              const roomNumber = rsQueue[0].room_number;
              // Send notify to H4U Server
              if (process.env.ENABLE_Q4U.toUpperCase() === 'Y') {

                if (rsQueue.length) {
                  const data = rsQueue[0];
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
                servicePointId: servicePointId,
                isInterview: isInterview
              }
              if (rs.length) {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, queueId: rs[0].queue_id, priorityId: rs[0].priority_id });
              } else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK });
              }

              fastify.mqttClient.publish(globalTopic, 'update visit', { qos: 0, retain: false });
              fastify.mqttClient.publish(servicePointTopic, JSON.stringify(payload), { qos: 0, retain: false });

            } else {
              reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send({
                  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                  message: 'ไม่พบคิวที่ต้องการ'
                });
            }
          } else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
          }
        } else {
          reply.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'ไม่พบ HN'
            });
        }
      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' })
      }

    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  });

  fastify.get('/nhso', async (req: fastify.Request, reply: fastify.Reply) => {
    const token = req.query.token;
    if (token) {
      // check token
      const rsToken: any = await tokenModel.find(db, token);
      if (rsToken.length) {
        try {
          const rs = await queueModel.getTokenNHSO(db);
          reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: rs[0] });
        } catch (error) {
          fastify.log.error(error);
          reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message })
        }
      } else {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) })
      }

    } else {
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'ไม่พบ TOKEN' });
    }
  });
  
  next();
  
};
module.exports = router;