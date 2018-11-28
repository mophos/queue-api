import * as knex from 'knex';

export class PriorityModel {

  tableName = 'q4u_priorities';

  list(db: knex) {
    return db(this.tableName).orderBy('priority_name');
  }

  getPrefix(db: knex, priorityId: any) {
    return db(this.tableName)
      .select('priority_prefix')
      .where('priority_id', priorityId).limit(1);
  }

  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  update(db: knex, priorityId: any, data: any) {
    return db(this.tableName).where('priority_id', priorityId).update(data);
  }

  remove(db: knex, priorityId: any) {
    return db(this.tableName).where('priority_id', priorityId).del();
  }

}