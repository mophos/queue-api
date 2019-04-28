/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as Random from 'random-js';

import { TokenModel } from '../models/token';
import moment = require('moment');

const tokenModel = new TokenModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await tokenModel.list(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const createdDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const expiredDate = moment().add(1, 'year').format('YYYY-MM-DD HH:mm:ss');
    const token = fastify.jwt.sign({
      issue: 'h4u',
      description: 'for access Q4U api',
      GLOBAL_NOTIFY_TOPIC: process.env.GLOBAL_NOTIFY_TOPIC,
      QUEUE_CENTER_TOPIC: process.env.QUEUE_CENTER_TOPIC,
      SERVICE_POINT_TOPIC: process.env.SERVICE_POINT_TOPIC,
      DEPARTMENT_TOPIC: process.env.DEPARTMENT_TOPIC,
      GROUP_TOPIC: process.env.GROUP_TOPIC,
      NOTIFY_USER: process.env.LOCAL_NOTIFY_USER,
      NOTIFY_PASSWORD: process.env.LOCAL_NOTIFY_PASSWORD,
      NOTIFY_SERVER: process.env.LOCAL_NOTIFY_SERVER,
      NOTIFY_PORT: process.env.LOCAL_NOTIFY_HTTP_PORT,
      SPEAK_SINGLE: process.env.SPEAK_SINGLE || 'N'
    }, { expiresIn: '1y' });

    const data: any = {
      token: token,
      created_date: createdDate,
      expired_date: expiredDate
    };

    try {
      await tokenModel.save(db, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.delete('/', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const token: any = req.query.token;

    try {
      await tokenModel.remove(db, token);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;