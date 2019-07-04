import * as knex from 'knex';

export class ServiceRoomModel {

  tableName = 'q4u_service_rooms';

  list(db: knex, servicePointId: any) {
    return db('q4u_service_rooms as sr')
      .select('sr.*', 'sp.sound_id as service_point_sound_id')
      .join('q4u_service_points as sp', 'sp.service_point_id', 'sr.service_point_id')
      .where('sr.service_point_id', servicePointId)
      .orderBy('sr.room_number', 'asc');
  }

  info(db: knex, roomId: any) {
    return db(this.tableName)
      .where('room_id', roomId)
  }

  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  update(db: knex, serviceRoomId: any, data: any) {
    return db(this.tableName).where('room_id', serviceRoomId).update(data);
  }

  remove(db: knex, serviceRoomId: any) {
    return db(this.tableName).where('room_id', serviceRoomId).del();
  }

}