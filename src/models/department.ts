import * as knex from 'knex';

export class DepartmentModel {

  tableName = 'q4u_departments';

  list(db: knex) {
    return db(this.tableName).orderBy('department_name');
  }

  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  update(db: knex, departmentId: any, data: any) {
    return db(this.tableName).where('department_id', departmentId).update(data);
  }

  remove(db: knex, departmentId: any) {
    return db(this.tableName).where('department_id', departmentId).del();
  }

}