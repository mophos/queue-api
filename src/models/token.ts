import * as knex from 'knex';

export class TokenModel {

  tableName: string = 'q4u_tokens';

  list(db: knex) {
    return db(this.tableName);
  }

  find(db: knex, token: any) {
    return db(this.tableName).where('token', token);
  }

  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  remove(db: knex, token: any) {
    return db(this.tableName)
      .where('token', token)
      .del();
  }

}