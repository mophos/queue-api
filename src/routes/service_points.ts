/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as Random from 'random-js';

import { ServicePointModel } from '../models/service_point';

const servicePointModel = new ServicePointModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  // get service point lists
  fastify.get('/', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await servicePointModel.list(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // save new service point
  fastify.post('/', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;

    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      topic: strRnd
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
  fastify.put('/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;

    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      topic: strRnd
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
  fastify.delete('/:servicePointId', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
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