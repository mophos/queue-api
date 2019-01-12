import * as knex from 'knex';

export class UserModel {

  tableName: string = 'q4u_users';

  list(db: knex) {
    return db(this.tableName)
      .select('user_id', 'username', 'fullname', 'is_active', 'user_type');
  }

  login(db: knex, username: string, password: string) {
    return db(this.tableName)
      .select('fullname', 'user_id', 'user_type')
      .where({
        username: username,
        password: password,
        is_active: 'Y'
      });
  }

  save(db: knex, user: any) {
    return db(this.tableName).insert(user);
  }

  update(db: knex, userId: any, info: any) {
    return db(this.tableName)
      .where('user_id', userId)
      .update(info);
  }

  remove(db: knex, userId: any) {
    return db(this.tableName)
      .where('user_id', userId)
      .del();
  }

}