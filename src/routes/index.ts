/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';

import { SystemModel } from '../models/system';
import * as HttpStatus from 'http-status-codes';
const systemModel = new SystemModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  fastify.get('/', async (req: fastify.Request, reply: fastify.Reply) => {
    reply.code(200).send({ message: 'Fastify, RESTful API services!' })
  });

  fastify.get('/info', async (req: fastify.Request, reply: fastify.Reply) => {
    try {
      const rs: any = await systemModel.getInfo(db);
      reply.code(HttpStatus.OK).send({ info: rs[0] })
    } catch (error) {
      console.log(error);
      reply.code(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  });

  // fastify.get('/sign-token', async (req: Request, reply: fastify.Reply) => {
  //   const token = fastify.jwt.sign({ foo: 'bar' }, { expiresIn: '1d' });
  //   reply.send({ token: token });
  // })

  // fastify.get('/test-db', {
  //   beforeHandler: [fastify.authenticate]
  // }, async (req: fastify.Request, reply: fastify.Reply) => {
  //   console.log(req.user);
  //   try {
  //     var rs = await userModel.getUser(db);
  //     reply.code(200).send({ ok: true, rows: rs });
  //   } catch (error) {
  //     req.log.error(error);
  //     reply.code(500).send({ ok: false, error: error.message });
  //   }
  // });

  next();

}

module.exports = router;