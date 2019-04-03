/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import { SoundModel } from '../models/sound';

const soundModel = new SoundModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  fastify.get('/', { beforeHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await soundModel.list(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }

  })



  fastify.put('/:servicePointId', { beforeHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;
    const soundId = req.body.soundId;

    const data: any = {
      sound_id: soundId,
    };

    try {
      await soundModel.update(db, servicePointId, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }

  })

  next();

}

module.exports = router;
