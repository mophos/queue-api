import * as knex from 'knex';

export class QueueModel {

  savePatient(db: knex, hn, title, firstName, lastName, birthdate, sex = '') {
    var sql = `
    INSERT INTO q4u_person(hn, title, first_name, last_name, birthdate, sex)
    VALUES(?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title=?, first_name=?, last_name=?, birthdate=?, sex=?
    `;
    return db.raw(sql, [
      hn, title, firstName, lastName, birthdate, sex,
      title, firstName, lastName, birthdate, sex
    ]);
  }

  saveQueue(db: knex, data: any) {
    return db('queue').insert(data);
  }

  updateServicePointQueueNumber(db: knex, servicePointId, dateServ) {
    return db('q4u_queue_number')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .increment('current_queue', 1);
  }

  createServicePointQueueNumber(db: knex, servicePointId, dateServ) {
    return db('q4u_queue_number')
      .insert({
        service_point_id: servicePointId,
        date_serv: dateServ,
        current_queue: 1
      });
  }

  checkServicePointQueueNumber(db: knex, servicePointId, dateServ) {
    return db('q4u_queue_number')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .limit(1);
  }

  createQueueInfo(db: knex, qData: any) {

    return db('q4u_queue')
      .insert({
        hn: qData.hn,
        vn: qData.vn,
        service_point_id: qData.servicePointId,
        date_serv: qData.dateServ,
        time_serv: qData.timeServ,
        queue_number: qData.queueNumber,
        his_queue: qData.hisQueue,
        priority_id: qData.priorityId,
        date_create: qData.dateCreate
      });
  }

  checkDuplicatedQueue(db: knex, hn: any, vn: any) {
    return db('q4u_queue')
      .select(db.raw('count(*) as total'))
      .where('hn', hn)
      .where('vn', vn);
  }

  getWaitingList(db: knex, dateServ: any, servicePointId: any, limit: any, offset: any) {
    return db('q4u_queue as q')
      .select('q.queue_id', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      .whereNull('q.room_id')
      .orderBy('q.date_update', 'asc')
      .groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
  }

  getWaitingListTotal(db: knex, dateServ: any, servicePointId: any) {
    return db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      .whereNull('q.room_id');
  }

  getWorking(db: knex, dateServ: any, servicePointId: any) {
    return db('q4u_queue_detail as qd')
      .select('qd.service_point_id', 'qd.date_serv as queue_date', 'qd.last_queue', 'qd.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'qd.queue_id', 'q.date_serv', 'q.time_serv', 'qd.update_date', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.prority_color',
        'r.room_name', 'r.room_number', 'sp.service_point_name')
      .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'qd.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('qd.date_serv', dateServ)
      .where('qd.service_point_id', servicePointId)
      .whereNot('q.mark_pending', 'Y')
      .groupByRaw('qd.date_serv, qd.service_point_id, qd.room_id')
      .orderBy('q.date_update', 'asc');
  }

  getPending(db: knex, dateServ: any, servicePointId: any) {
    return db('q4u_queue_detail as qd')
      .select('qd.service_point_id', 'qd.date_serv as queue_date', 'qd.last_queue', 'qd.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'qd.queue_id', 'q.date_serv', 'q.time_serv', 'qd.update_date', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.prority_color',
        'r.room_name', 'r.room_id', 'r.room_number', 'sp.service_point_name')
      .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('qd.date_serv', dateServ)
      .where('qd.service_point_id', servicePointId)
      .where('q.mark_pending', 'Y')
      .groupByRaw('qd.service_point_id, qd.date_serv, qd.room_id')
      .orderBy('q.date_update', 'asc');
  }

  setQueueRoomNumber(db: knex, queueId, roomId) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ room_id: roomId });
  }

  markUnPending(db: knex, queueId) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ mark_pending: 'N' });
  }

  updateCurrentQueue(db: knex, servicePointId, dateServ, queueId, roomId) {
    var sql = `
    INSERT INTO q4u_queue_detail(service_point_id, date_serv, queue_id, room_id)
    VALUES(?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE queue_id=?
    `;
    return db.raw(sql, [servicePointId, dateServ, queueId, roomId, queueId]);
  }

  getCurrentVisitOnQueue(db: knex, dateServ: any) {
    var sql = db('q4u_queue')
      .select('vn')
      .where('date_serv', dateServ);
    return sql;
  }

  markPending(db: knex, queueId: any) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ mark_pending: 'Y' });
  }

  getCurrentQueueList(db: knex, dateServ: any) {

    const sql = `
    select a.*, r.room_name, r.room_number, q.queue_number, sp.service_point_name,
     p.title, p.first_name, p.last_name, p.hn,
    (select count(*) as total from q4u_queue as qx where qx.service_point_id=a.service_point_id and qx.room_id is null) as total
    from (
    select qd1.*
    from q4u_queue_detail as qd1
    left join q4u_queue_detail as qd2 on 
    (qd1.service_point_id=qd2.service_point_id and qd1.update_date<qd2.update_date)
    where qd2.update_date is null
    ) as a
    left join q4u_service_rooms as r on r.room_id=a.room_id
    inner join q4u_queue as q on q.queue_id=a.queue_id
    inner join q4u_service_points as sp on sp.service_point_id=q.service_point_id
    inner join q4u_person as p on p.hn=q.hn
    where a.date_serv=?
    order by sp.service_point_name
    `;

    return db.raw(sql, [dateServ]);
  }

}