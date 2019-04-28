import * as knex from 'knex';

export class SoundModel {


  list(db: knex) {
    return db('q4u_sounds').orderBy('sound_id');
  }

  update(db: knex, servicePointId: any, data: any) {
    return db('q4u_service_points').where('service_point_id', servicePointId).update(data);
  }

}