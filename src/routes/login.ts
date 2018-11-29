/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as crypto from 'crypto';
import * as HttpStatus from 'http-status-codes';
import { UserModel } from '../models/user';

const userModel = new UserModel();

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;

  fastify.post('/', async (req: fastify.Request, reply: fastify.Reply) => {
    const body: any = req.body;

    const username = body.username;
    const password = body.password;
    const encPassword = crypto.createHash('md5').update(password).digest('hex');

    try {
      const rs: any = await userModel.login(db, username, encPassword);
      if (!rs.length) {
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, message: 'ชื่อผู้ใช้งานหรือรหัสผ่าน ไม่ถูกต้อง' })
      } else {
        const info = rs[0];
        const token = fastify.jwt.sign({ fullname: info.fullname, userId: info.user_id }, { expiresIn: '1d' });
        reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, token: token });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;