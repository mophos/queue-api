/// <reference path="../../typings.d.ts" />

import * as knex from 'knex';
import * as fastify from 'fastify';

import { SystemModel } from '../models/system';
import * as HttpStatus from 'http-status-codes';

const systemModel = new SystemModel();

const router = (fastify, { }, next) => {

  var db: knex = fastify.db;

  fastify.get('/', async (req: fastify.Request, reply: fastify.Reply) => {
    reply.view('templates/queue-qrcode');
  });

  next();

}

module.exports = router;