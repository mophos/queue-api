import * as knex from 'knex';

export class ServicePointModel {

  tableName = 'q4u_service_points';

  list(db: knex) {
    return db('q4u_service_points as sp')
      .select('sp.*', 'd.department_name', 's.sound_file')
      .leftJoin('q4u_departments as d', 'd.department_id', 'sp.department_id')
      .leftJoin('q4u_sounds as s', 's.sound_id', 'sp.sound_id')
      .orderBy('sp.service_point_name');
  }

  listKios(db: knex) {
    return db('q4u_service_points as sp')
      .select('sp.*', 'd.department_name')
      .leftJoin('q4u_departments as d', 'd.department_id', 'sp.department_id')
      .where('sp.kios', 'Y')
      .orderBy('sp.service_point_name');
  }

  getServicePointIdFromLocalCode(db: knex, localCode: any) {
    return db(this.tableName).select('service_point_id').where('local_code', localCode).limit(1);
  }

  getPrefix(db: knex, servicePointId: any) {
    return db(this.tableName)
      .where('service_point_id', servicePointId)
      .limit(1);
  }

  getLocalCode(db: knex) {
    return db(this.tableName).select('local_code');
  }

  getSound(db: knex, servicePointId: any) {
    return db('q4u_service_points as sp')
      .join('q4u_sounds as s', 'sp.sound_id', 's.sound_id')
      .select('sp.sound_id', 'sp.sound_speed', 's.sound_file')
      .where('service_point_id', servicePointId);
  }

  getSoundList(db: knex, servicePointId: any) {
    return db('q4u_service_points as sp')
      .select('sp.sound_id', 'sr.room_id', 's.sound_file')
      .join('q4u_service_rooms as sr', 'sr.service_point_id', 'sp.service_point_id')
      .join('q4u_sounds as s', 'sr.sound_id', 's.sound_id')
      .where('sp.service_point_id', servicePointId);
  }

  getSoundListDepartment(db: knex, departmentId: any) {
    return db('q4u_service_points as sp')
      .select('sp.sound_id', 'sr.room_id', 's.sound_file')
      .join('q4u_service_rooms as sr', 'sr.service_point_id', 'sp.service_point_id')
      .join('q4u_sounds as s', 'sr.sound_id', 's.sound_id')
      .where('sp.department_id', departmentId);
  }

  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  update(db: knex, servicePointId: any, data: any) {
    return db(this.tableName).where('service_point_id', servicePointId).update(data);
  }

  remove(db: knex, servicePointId: any) {
    return db(this.tableName).where('service_point_id', servicePointId).del();
  }

}