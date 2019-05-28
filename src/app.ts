/// <reference path="../typings.d.ts" />

import path = require('path');
import * as HttpStatus from 'http-status-codes';
import * as fastify from 'fastify';

const serveStatic = require('serve-static');

require('dotenv').config({ path: path.join(__dirname, '../config') });

import { Server, IncomingMessage, ServerResponse } from 'http';

import helmet = require('fastify-helmet');

const app: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
  logger: {
    level: 'error',
    prettyPrint: true
  },
  bodyLimit: 5 * 1048576,
});

app.register(require('fastify-formbody'));
app.register(require('fastify-cors'), {});
app.register(require('fastify-no-icon'));
app.register(
  helmet,
  { hidePoweredBy: { setTo: 'PHP 5.2.0' } }
);

app.register(require('fastify-rate-limit'), {
  max: +process.env.MAX_CONNECTION_PER_MINUTE || 1000000,
  timeWindow: '1 minute'
});

app.use(serveStatic(path.join(__dirname, '../public')));

app.register(require('fastify-jwt'), {
  secret: process.env.SECRET_KEY
});

var templateDir = path.join(__dirname, '../templates');
app.register(require('point-of-view'), {
  engine: {
    ejs: require('ejs')
  },
  templates: templateDir
});

app.decorate("authenticate", async (request, reply) => {
  let token: string = null;

  if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.query && request.query.token) {
    token = request.query.token;
  } else {
    token = request.body.token;
  }

  try {
    const decoded = await request.jwtVerify(token);
  } catch (err) {
    reply.status(HttpStatus.UNAUTHORIZED).send({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED),
      message: '401 UNAUTHORIZED!'
    })
  }
});

app.register(require('./plugins/db'), {
  connection: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: +process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: {
      min: 0,
      max: 7,
      afterCreate: (conn, done) => {
        conn.query('SET NAMES utf8', (err) => {
          done(err, conn);
        });
      }
    },
    debug: false,
  },
  connectionName: 'db'
});

if (process.env.DBHIS_TYPE === 'pg' || process.env.DBHIS_TYPE === 'mssql' || process.env.DBHIS_TYPE === 'oracledb') {

  if (process.env.DBHIS_TYPE === 'pg') {
    app.register(require('./plugins/db'), {
      connection: {
        client: process.env.DBHIS_TYPE,
        connection: {
          host: process.env.DBHIS_HOST,
          user: process.env.DBHIS_USER,
          port: +process.env.DBHIS_PORT,
          password: process.env.DBHIS_PASSWORD,
          database: process.env.DBHIS_NAME,
        },
        searchPath: ['public'],
        pool: {
          min: 0,
          max: 7
        },
        debug: false,
      },

      connectionName: 'dbHIS'
    });
  } else {
    app.register(require('./plugins/db'), {
      connection: {
        client: process.env.DBHIS_TYPE,
        connection: {
          host: process.env.DBHIS_HOST,
          user: process.env.DBHIS_USER,
          port: +process.env.DBHIS_PORT,
          password: process.env.DBHIS_PASSWORD,
          database: process.env.DBHIS_NAME,
        },
        pool: {
          min: 0,
          max: 7
        },
        debug: false,
      },
      connectionName: 'dbHIS'
    });
  }

} else {
  app.register(require('./plugins/db'), {
    connection: {
      client: 'mysql',
      connection: {
        host: process.env.DBHIS_HOST,
        user: process.env.DBHIS_USER,
        port: +process.env.DBHIS_PORT,
        password: process.env.DBHIS_PASSWORD,
        database: process.env.DBHIS_NAME,
      },
      pool: {
        min: 0,
        max: 7,
        afterCreate: (conn, done) => {
          conn.query('SET NAMES utf8', (err) => {
            done(err, conn);
          });
        }
      },
      debug: false,
    },
    connectionName: 'dbHIS'
  });
}

// MQTT
app.register(require('./plugins/mqtt'), {
  host: process.env.INTERNAL_NOTIFY_SERVER,
  username: process.env.LOCAL_NOTIFY_USER,
  password: process.env.LOCAL_NOTIFY_PASSWORD
});


app.decorate('verifyAdmin', function (request, reply, done) {
  if (request.user.userType === 'ADMIN') {
    done();
  } else {
    reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
  }
});

app.decorate('verifyMember', function (request, reply, done) {
  if (request.user.userType === 'MEMBER') {
    done();
  } else {
    reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
  }
});

app.register(require('./routes/index'), { prefix: '/v1', logger: true });
app.register(require('./routes/login'), { prefix: '/v1/login', logger: true });
app.register(require('./routes/users'), { prefix: '/v1/users', logger: true });
app.register(require('./routes/token'), { prefix: '/v1/token', logger: true });
app.register(require('./routes/api'), { prefix: '/v1/api', logger: true });
app.register(require('./routes/service_points'), { prefix: '/v1/service-points', logger: true });
app.register(require('./routes/service_rooms'), { prefix: '/v1/service-rooms', logger: true });
app.register(require('./routes/priorities'), { prefix: '/v1/priorities', logger: true });
app.register(require('./routes/queue'), { prefix: '/v1/queue', logger: true });
app.register(require('./routes/departments'), { prefix: '/v1/departments', logger: true });
app.register(require('./routes/print'), { prefix: '/v1/print', logger: true });
app.register(require('./routes/sounds'), { prefix: '/v1/sounds', logger: true });
app.register(require('./routes/kiosk'), { prefix: '/v1/kiosk', logger: true });

app.get('/', async (req: fastify.Request, reply: fastify.Reply) => {
  reply.code(200).send({ message: 'Welcome to Q4U API services!', version: '3.0 build 20190417-1' })
});

const port = 3002;
const host = '0.0.0.0';

app.listen(port, host, (err) => {
  if (err) throw err;
  console.log(app.server.address());
});
