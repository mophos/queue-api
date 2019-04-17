/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import { ServiceRoomModel } from '../models/service_room';

const roomModel = new ServiceRoomModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  // get service point lists
  fastify.get('/:servicePointId', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const servicePointId = req.params.servicePointId;
      const rs: any = await roomModel.list(db, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // save new service room
  fastify.post('/', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const roomName = req.body.roomName;
    const roomNumber = req.body.roomNumber;
    const servicePointId = req.body.servicePointId;

    const data: any = {
      room_number: roomNumber,
      room_name: roomName,
      service_point_id: servicePointId,
    };

    try {
      await roomModel.save(db, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // update service room
  fastify.put('/:roomId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const roomId: any = req.params.roomId;
    const roomName = req.body.roomName;
    const roomNumber = req.body.roomNumber;
    const servicePointId = req.body.servicePointId;

    const data: any = {
      room_number: roomNumber,
      room_name: roomName,
      service_point_id: servicePointId,
    };

    try {
      await roomModel.update(db, roomId, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // remove service point
  fastify.delete('/:roomId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const roomId: any = req.params.roomId;

    try {
      await roomModel.remove(db, roomId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;