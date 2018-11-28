import * as knex from 'knex';

export class SystemModel {

  getInfo(db: knex) {
    return db('q4u_system').select();
  }
}