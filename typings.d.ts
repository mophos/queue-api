import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as Knex from 'knex'

declare module 'fastify' {
  interface FastifyRequest<HttpRequest> {
    user: any;
  }
  interface FastifyReply<HttpResponse> { }
  interface Request extends FastifyRequest<IncomingMessage> { }
  interface Reply extends FastifyReply<ServerResponse> { }
  interface FastifyInstance {
    db: Knex;
    db1: Knex;
    db2: Knex;
  }
}

