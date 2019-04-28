/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import { Random } from "random-js";

import { ServicePointModel } from '../models/service_point';

const servicePointModel = new ServicePointModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  // get service point lists
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await servicePointModel.list(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/kios', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await servicePointModel.listKios(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // save new service point
  fastify.post('/', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;
    const departmentId = req.body.departmentId;
    const prefix = req.body.prefix;
    const kios = req.body.kios;
    const useOldQueue = req.body.useOldQueue || 'N';
    const groupCompare = req.body.groupCompare || 'N';
    const priorityQueueRunning = req.body.priorityQueueRunning || 'N';
    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      department_id: departmentId,
      prefix: prefix,
      topic: strRnd,
      kios: kios,
      use_old_queue: useOldQueue,
      group_compare: groupCompare,
      priority_queue_running: priorityQueueRunning
    };

    try {
      await servicePointModel.save(db, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // update service point
  fastify.put('/:servicePointId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;
    const departmentId = req.body.departmentId;
    const prefix = req.body.prefix;
    const kios = req.body.kios;
    const useOldQueue = req.body.useOldQueue || 'N';
    const groupCompare = req.body.groupCompare || 'N';
    const priorityQueueRunning = req.body.priorityQueueRunning || 'N';
    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      department_id: departmentId,
      prefix: prefix,
      topic: strRnd,
      kios: kios,
      use_old_queue: useOldQueue,
      group_compare: groupCompare,
      priority_queue_running: priorityQueueRunning
    };

    try {
      await servicePointModel.update(db, servicePointId, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // remove service point
  fastify.delete('/:servicePointId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;

    try {
      await servicePointModel.remove(db, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;