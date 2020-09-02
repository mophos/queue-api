import * as knex from 'knex';

export class QueueModel {

  savePatient(db: knex, hn, title, firstName, lastName, birthdate, sex = '') {
    const sql = `
    INSERT INTO q4u_person(hn, title, first_name, last_name, birthdate, sex)
    VALUES(?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title=?, first_name=?, last_name=?, birthdate=?, sex=?
    `;
    return db.raw(sql, [
      hn, title, firstName, lastName, birthdate, sex,
      title, firstName, lastName, birthdate, sex
    ]);
  }

  updateServicePointQueueNumber(db: knex, servicePointId: any, dateServ: any, priorityId: any = null) {
    const sql = db('q4u_queue_number')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ);

    if (priorityId) {
      sql.where('priority_id', priorityId);
    }

    return sql.increment('current_queue', 1);
  }

  updateServicePointQueueNumberWithPriority(db: knex, servicePointId: any, dateServ: any, priorityId: any) {
    return db('q4u_queue_number')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .increment('current_queue', 1);
  }

  markInterview(db: knex, queueId: any) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({
        'is_interview': 'Y',
      });
  }

  markInterviewGroup(db: knex, queueId: any) {
    return db('q4u_queue')
      .whereIn('queue_id', queueId)
      .update({
        'is_interview': 'Y',
      });
  }

  markCompleted(db: knex, queueId: any) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({
        'is_completed': 'Y',
      });
  }

  markCompletedGroup(db: knex, queueId: any) {
    return db('q4u_queue')
      .whereIn('queue_id', queueId)
      .update({
        'is_completed': 'Y',
      });
  }

  createServicePointQueueNumber(db: knex, servicePointId: any, dateServ: any, priorityId: any = null) {
    const data: any = {};
    data.service_point_id = servicePointId;
    data.date_serv = dateServ;
    data.current_queue = 1;

    if (priorityId) {
      data.priority_id = priorityId;
    }

    return db('q4u_queue_number')
      .insert(data);
  }

  // createServicePointQueueNumberWithPriority(db: knex, servicePointId: any, dateServ: any, priorityId: any) {
  //   return db('q4u_queue_number')
  //     .insert({
  //       service_point_id: servicePointId,
  //       date_serv: dateServ,
  //       current_queue: 1,
  //       priority_id: priorityId
  //     });
  // }

  checkServicePointQueueNumber(db: knex, servicePointId: any, dateServ: any, priorityId: any = null) {
    const sql = db('q4u_queue_number')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ);

    if (priorityId) {
      sql.where('priority_id', priorityId);
    }

    return sql.limit(1);
  }

  // checkServicePointQueueNumberWithPriority(db: knex, servicePointId: any, dateServ: any, priorityId: any) {
  //   return db('q4u_queue_number')
  //     .where('service_point_id', servicePointId)
  //     .where('date_serv', dateServ)
  //     .where('priority_id', priorityId)
  //     .limit(1);
  // }

  createQueueInfo(db: knex, qData: any) {

    return db('q4u_queue')
      .insert({
        hn: qData.hn,
        vn: qData.vn,
        service_point_id: qData.servicePointId,
        date_serv: qData.dateServ,
        time_serv: qData.timeServ,
        queue_number: qData.queueNumber,
        queue_running: qData.queueRunning,
        his_queue: qData.hisQueue,
        priority_id: qData.priorityId,
        date_create: qData.dateCreate,
        queue_interview: qData.queueInterview
      }, 'queue_id');
  }

  // checkDuplicatedQueue(db: knex, hn: any, vn: any, servicePointId: any) {
  //   return db('q4u_queue')
  //     .select(db.raw('count(*) as total'))
  //     .where('service_point_id', servicePointId)
  //     .where('hn', hn)
  //     .where('vn', vn);
  // }

  searchQueueByDepartmentId(db: knex, dateServ: any, departmentId: any, limit: any, offset: any, query: any) {
    const _query = `%${query}%`;
    return db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview',
        'sp.department_id', 'sd.department_name', 'sp.service_point_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.date_serv', dateServ)
      .where('q.mark_pending', 'N')
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query);
      })
      .whereNot('q.is_cancel', 'Y')
      .orderBy('q.queue_id', 'asc')
      .groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);

  }

  searchQueueByDepartmentIdTotal(db: knex, dateServ: any, departmentId: any, query: any) {
    const _query = `%${query}%`;
    return db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.mark_pending', 'N')
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query);
      })
      .whereNot('q.is_cancel', 'Y')
      .where('q.date_serv', dateServ);
    // .whereNull('q.room_id');
  }

  getQueueByDepartmentId(db: knex, dateServ: any, departmentId: any, limit: any, offset: any, sort: any) {
    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview',
        'sp.department_id', 'sd.department_name', 'sp.service_point_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.date_serv', dateServ)
      .where('q.mark_pending', 'N')
      .where('q.is_completed', 'N')
      .whereNot('q.is_cancel', 'Y');
    if (sort == 'ASC') {
      sql.orderBy([{ column: 'pr.priority_order', order: 'asc' }, { column: 'q.queue_id', order: 'asc' }]);
    } else if (sort == 'DESC') {
      sql.orderBy([{ column: 'pr.priority_order', order: 'desc' }, { column: 'q.queue_id', order: 'asc' }]);
    } else {
      sql.orderBy('q.queue_id', 'asc');
    }
    sql.groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
    return sql;

  }

  getQueueHistoryByDepartmentId(db: knex, dateServ: any, departmentId: any, limit: any, offset: any) {
    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview',
        'sp.department_id', 'sd.department_name', 'sp.service_point_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.date_serv', dateServ)
      .where('q.mark_pending', 'N')
      .where('q.is_completed', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .orderBy('q.queue_id', 'asc')
      .groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
    return sql;

  }

  getQueueByDepartmentIdTotal(db: knex, dateServ: any, departmentId: any) {
    return db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.mark_pending', 'N')
      .where('q.is_completed', 'N')
      .whereNot('q.is_cancel', 'Y')
      .where('q.date_serv', dateServ);
    // .whereNull('q.room_id');
  }

  getQueueHistoryByDepartmentIdTotal(db: knex, dateServ: any, departmentId: any) {
    return db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .innerJoin('q4u_departments as sd', 'sp.department_id', 'sd.department_id')
      .where('sp.department_id', departmentId)
      .where('q.mark_pending', 'N')
      .where('q.is_completed', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .where('q.date_serv', dateServ);
    // .whereNull('q.room_id');
  }

  getWaitingGroupList(db: knex, dateServ: any, servicePointId: any, priorityId: any, limit: any, offset: any) {
    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number', 'q.queue_running',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      .whereNull('q.room_id')
      .whereNotIn('q.queue_id', db('q4u_queue_group_detail').select('queue_id').where('date_serv', dateServ).where('service_point_id', servicePointId))
      .where('q.mark_pending', 'N')
      .where('q.date_serv', dateServ);

    if (priorityId) {
      sql.where('q.priority_id', priorityId);
    }

    return sql.whereNot('q.is_cancel', 'Y')
      .orderBy('q.queue_id', 'asc')
      .groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
  }

  searchWaitingGroupList(db: knex, dateServ: any, servicePointId: any, priorityId: any, limit: any, offset: any, query: string) {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number', 'q.queue_running',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      .whereNull('q.room_id')
      .whereNotIn('q.queue_id', db('q4u_queue_group_detail').select('queue_id').where('date_serv', dateServ).where('service_point_id', servicePointId))
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query);
      });

    if (priorityId) {
      sql.where('q.priority_id', priorityId);
    }

    return sql.where('q.mark_pending', 'N')
      .where('q.date_serv', dateServ)
      .whereNot('q.is_cancel', 'Y')
      .orderBy('q.queue_id', 'asc')
      .groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
  }

  getWaitingGroupListTotal(db: knex, dateServ: any, servicePointId: any, priorityId: any) {
    const sql = db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.mark_pending', 'N')
      .whereNotIn('q.queue_id', db('q4u_queue_group_detail').select('queue_id').where('date_serv', dateServ).where('service_point_id', servicePointId))
      .whereNot('q.is_cancel', 'Y')
      .where('q.date_serv', dateServ);

    if (priorityId) {
      sql.where('q.priority_id', priorityId);
    }

    return sql.whereNull('q.room_id');
  }

  getWaitingList(db: knex, dateServ: any, servicePointId: any, limit: any, offset: any, sort: any = '', query = '') {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview', 'q.is_completed')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      .where('q.is_completed', 'N')
      .where((w) => {
        w.orWhere('q.hn', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhereRaw(`REPLACE(q.queue_number,' ','') like '${_query}'`);
      })
      .whereNot('q.is_cancel', 'Y')
      .whereNot('q.mark_pending', 'Y');
    if (sort == 'ASC') {
      sql.orderBy([{ column: 'pr.priority_order', order: 'asc' }, { column: 'q.queue_id', order: 'asc' }]);
    } else if (sort == 'DESC') {
      sql.orderBy([{ column: 'pr.priority_order', order: 'desc' }, { column: 'q.queue_id', order: 'asc' }]);
    } else {
      sql.orderBy('q.queue_id', 'asc');
    }
    sql.groupBy('q.queue_id')
      .limit(limit)
      .offset(offset);
    return sql;
  }

  getWaitingListTotal(db: knex, dateServ: any, servicePointId: any, query = '') {
    const _query = `%${query}%`;
    return db('q4u_queue as q')
      .select(db.raw('count(*) as total'))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.is_completed', 'N')
      .whereNot('q.is_cancel', 'Y')
      .whereNot('q.mark_pending', 'Y')
      .where('q.date_serv', dateServ)
      .where((w) => {
        w.orWhere('q.hn', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhereRaw(`REPLACE(q.queue_number,' ','') like '${_query}'`);
      });
    // .whereNull('q.room_id');
  }

  getWaitingListQuery(db: knex, dateServ: any, servicePointId: any, query: any = '', prioityId: any = '') {
    const _query = `%${query}%`;

    const sql = db('q4u_queue as q')
      .select('q.queue_id', 'q.queue_interview', 'q.hn', 'q.vn', 'q.service_point_id', 'q.priority_id', 'q.queue_number',
        'q.room_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name',
        'p.last_name', 'p.birthdate', 'pr.priority_name', 'q.is_interview')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .where('q.service_point_id', servicePointId)
      .where('q.date_serv', dateServ)
      // .whereNull('q.room_id')
      .where('q.is_completed', 'N')
      .whereNot('q.is_cancel', 'Y')
      .whereNot('q.mark_pending', 'Y')
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query);
      });
    if (prioityId != '') {
      sql.where('q.priority_id', prioityId);
    }
    sql.orderBy('q.queue_id', 'asc')
      .groupBy('q.queue_id')
      .limit(50);
    return sql;
  }

  getWorking(db: knex, dateServ: any, servicePointId: any, query: any) {
    const _query = `%${query}%`;
    const sql = db('q4u_queue_detail as qd')
      .select('qd.service_point_id', 'q.queue_interview', 'qd.date_serv as queue_date', 'qd.last_queue', 'qd.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'qd.queue_id', 'q.date_serv', 'q.time_serv', 'qd.update_date', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_number', 'sp.service_point_name', 'sp.department_id', 'q.is_completed')
      .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'qd.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('qd.date_serv', dateServ)
      .where('qd.service_point_id', servicePointId);

    if (query) {
      sql.where((w) => {
        w.orWhere('q.hn', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhereRaw(`REPLACE(q.queue_number,' ','') like '${_query}'`);
      });
    }

    sql.whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .groupByRaw('qd.date_serv, qd.service_point_id, qd.room_id')
      .orderBy('qd.update_date', 'desc');

    return sql;
  }

  getWorkingGroup(db: knex, dateServ: any, servicePointId: any) {
    return db('q4u_queue_group_detail as qd')
      .select('qd.service_point_id', 'q.queue_interview', 'qd.date_serv as queue_date', 'qd.last_queue', 'qd.room_id',
        'q.queue_number', 'q.queue_running', 'q.hn', 'q.vn', 'qd.queue_id', 'q.date_serv', 'q.time_serv', 'qd.update_date', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color', 'q.is_completed',
        'r.room_name', 'r.room_number', 'sp.service_point_name')
      .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'qd.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('qd.date_serv', dateServ)
      .where('qd.service_point_id', servicePointId)
      .whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .where('qd.update_date', db('q4u_queue_group_detail').select('update_date').where('date_serv', dateServ).where('service_point_id', servicePointId).orderBy('update_date', 'desc').limit(1))
      // .groupByRaw('qd.date_serv, qd.service_point_id, qd.room_id')
      .orderBy('q.date_update', 'desc')
      .orderBy('q.queue_running');
  }

  getWorkingDepartment(db: knex, dateServ: any, departmentId: any) {

    const sql = db('q4u_queue as q')
      .select('q.service_point_id', 'q.queue_interview', 'q.date_serv as queue_date', 'q.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'q.queue_id', 'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color', 'q.is_completed',
        'r.room_name', 'r.room_number', 'sp.service_point_name', db.raw(`ifnull(qd.update_date,CURRENT_DATE) as update_date`))
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .leftJoin('q4u_queue_detail as qd', 'qd.queue_id', 'q.queue_id')
      .where('q.date_serv', dateServ)
      .where('sp.department_id', departmentId)
      // .where('q.is_completed', 'Y')
      .whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .groupBy('q.room_id')
      .orderBy('qd.update_date', 'desc');
    return sql;

  }

  getAllQueueActive(db: knex, dateServ: any) {
    return db('q4u_queue as q')
      .select(
        'q.queue_number', 'q.hn', 'q.vn', 'q.queue_id', 'q.room_id', 'r.room_name', 'r.room_number',
        'q.date_serv', 'q.time_serv', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color', 'sp.service_point_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .where('q.date_serv', dateServ)
      .whereNot('q.is_cancel', 'Y')
      .orderBy('q.queue_id', 'desc');
  }

  searchWorkingHistoryGroup(db: knex, dateServ: any, limit: any, offset: any, servicePointId: any, query: any) {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.service_point_id', 'q.date_serv as queue_date', 'qgd.room_id',
        'q.queue_number', 'q.queue_running', 'q.hn', 'q.vn', 'q.queue_id', 'q.queue_interview', 'q.date_serv', 'q.time_serv', 'q.date_update', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_number', 'sp.service_point_name')
      // .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_queue_group_detail as qgd', 'qgd.queue_id', 'q.queue_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'qgd.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('q.date_serv', dateServ)
      .where('q.service_point_id', servicePointId)
      .whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query);
      })
      // .groupByRaw('qd.date_serv, qd.service_point_id')
      .limit(limit)
      .offset(offset)
      .orderBy('qgd.update_date', 'desc')
      .orderBy('qgd.queue_running', 'desc');
    return sql;

  }

  getWorkingHistoryGroup(db: knex, dateServ: any, servicePointId: any) {
    const sql = db('q4u_queue as q')
      .select('q.service_point_id', 'q.date_serv as queue_date', 'qgd.room_id',
        'q.queue_number', 'q.queue_running', 'q.hn', 'q.vn', 'q.queue_id', 'q.queue_interview', 'q.date_serv', 'q.time_serv', 'q.date_update', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_number', 'sp.service_point_name')
      // .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_queue_group_detail as qgd', 'qgd.queue_id', 'q.queue_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'qgd.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('q.date_serv', dateServ)
      .where('q.service_point_id', servicePointId)
      .whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      // .groupByRaw('qd.date_serv, qd.service_point_id')
      .limit(10)
      .orderBy('qgd.update_date', 'desc')
      .orderBy('qgd.queue_running', 'desc');
    return sql;
  }

  getWorkingHistoryGroupTotal(db: knex, dateServ: any, servicePointId: any) {
    const sql = db('q4u_queue as q')
      .select(db.raw('count(q.queue_id) as total'))
      // .innerJoin('q4u_queue as q', 'q.queue_id', 'qd.queue_id')
      // .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      // .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_queue_group_detail as qgd', 'qgd.queue_id', 'q.queue_id')
      // .innerJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      // .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('q.date_serv', dateServ)
      .where('q.service_point_id', servicePointId)
      .whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y');
    // .groupByRaw('qd.date_serv, qd.service_point_id')
    return sql;
  }

  getWorkingHistory(db: knex, dateServ: any, servicePointId: any, query = '', prioityId = '') {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.service_point_id', 'q.date_serv as queue_date', 'q.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'q.queue_id', 'q.queue_interview', 'q.date_serv', 'q.time_serv', 'q.date_update', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_number', 'sp.service_point_name', 'q.is_interview')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .innerJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('q.date_serv', dateServ)
      .where('q.service_point_id', servicePointId)
      .where((w) => {
        w.orWhere('q.hn', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhereRaw(`REPLACE(q.queue_number,' ','') like '${_query}'`);
      });
    if (prioityId != '') {
      sql.where('q.priority_id', prioityId);
    }
    sql.whereNot('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      // .groupByRaw('qd.date_serv, qd.service_point_id')
      .limit(10)
      .orderBy('q.date_update', 'desc');
    return sql;

  }

  getPending(db: knex, dateServ: any, servicePointId: any, query: any = '', prioityId: any = '') {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.service_point_id', 'q.pending_to_service_point_id', 'q.date_serv as queue_date', 'q.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'q.queue_id', 'q.queue_interview', 'q.date_serv', 'q.time_serv', 'q.date_update', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_id', 'r.room_number', 'sp.service_point_name', 'sp2.service_point_name as pending_to_service_point_name',
        'sp.department_id', 'sp2.department_id as pending_to_department_id')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .leftJoin('q4u_service_points as sp2', 'sp2.service_point_id', 'q.pending_to_service_point_id')
      .where('q.date_serv', dateServ)
      .where('q.service_point_id', servicePointId)
      .where('q.mark_pending', 'Y')
      .where((w) => {
        w.where('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query)
          .orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query);
      });
    if (prioityId != '') {
      sql.where('q.priority_id', prioityId);
    }
    sql.whereNot('q.is_cancel', 'Y')
      .groupByRaw('q.service_point_id, q.date_serv, q.queue_number')
      .orderBy('q.queue_id', 'asc');
    return sql;
  }

  getPendingByDepartment(db: knex, dateServ: any, departmentId: any) {
    return db('q4u_queue as q')
      .select('q.service_point_id', 'q.pending_to_service_point_id', 'q.date_serv as queue_date', 'q.room_id',
        'q.queue_number', 'q.hn', 'q.vn', 'q.queue_id', 'q.queue_interview', 'q.date_serv', 'q.time_serv', 'q.date_update', 'p.title', 'p.first_name', 'p.last_name',
        'p.birthdate', 'pr.priority_name', 'pr.priority_id', 'pr.priority_color',
        'r.room_name', 'r.room_id', 'r.room_number', 'sp.service_point_name', 'sp2.service_point_name as pending_to_service_point_name')
      .innerJoin('q4u_person as p', 'p.hn', 'q.hn')
      .innerJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .leftJoin('q4u_service_points as sp2', 'sp2.service_point_id', 'q.pending_to_service_point_id')
      // .innerJoin('q4u_departments as qd', 'q.service_point_id', 'qd.service_point_id')
      .where('q.date_serv', dateServ)
      .where('sp.department_id', departmentId)
      .where('q.mark_pending', 'Y')
      .whereNot('q.is_cancel', 'Y')
      .groupByRaw('q.service_point_id, q.date_serv, q.queue_number')
      .orderBy('q.queue_id', 'asc');

  }

  setQueueRoomNumber(db: knex, queueId, roomId) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ room_id: roomId });
  }
  setQueueGroupRoomNumber(db: knex, queueId, roomId) {
    return db('q4u_queue')
      .whereIn('queue_id', queueId)
      .update({ room_id: roomId });
  }

  markUnPending(db: knex, queueId) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ mark_pending: 'N' });
  }

  markUnPendingGroup(db: knex, queueId) {
    return db('q4u_queue')
      .whereIn('queue_id', queueId)
      .update({ mark_pending: 'N' });
  }

  markCancel(db: knex, queueId) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ is_cancel: 'Y' });
  }

  updateCurrentQueue(db: knex, servicePointId, dateServ, queueId, roomId) {
    const sql = `
    INSERT INTO q4u_queue_detail(service_point_id, date_serv, queue_id, room_id)
    VALUES(?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE queue_id=?
    `;
    return db.raw(sql, [servicePointId, dateServ, queueId, roomId, queueId]);
  }

  // updateCurrentQueueGroup(db: knex, servicePointId, dateServ, queueId, roomId, queueRunning) {
  //   const sql = `
  //   INSERT INTO q4u_queue_group_detail(service_point_id, date_serv, queue_id, room_id, queue_running)
  //   VALUES(?, ?, ?, ?, ?)
  //   ON DUPLICATE KEY UPDATE queue_id=?
  //   `;
  //   return db.raw(sql, [servicePointId, dateServ, queueId, roomId, queueRunning, queueId]);
  // }

  updateCurrentQueueGroups(db: knex, queues: any) {
    return db('q4u_queue_group_detail').insert(queues);
  }

  removeCurrentQueue(db: knex, servicePointId, dateServ, queueId) {
    return db('q4u_queue_detail')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .where('queue_id', queueId)
      .del();
  }

  removeCurrentQueueGroup(db: knex, servicePointId, dateServ, queueId) {
    return db('q4u_queue_group_detail')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .where('queue_id', queueId)
      .del();
  }

  removeCurrentQueueGroups(db: knex, servicePointId, dateServ, roomId) {
    return db('q4u_queue_group_detail')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .where('room_id', roomId)
      .del();
  }

  getCurrentVisitOnQueue(db: knex, dateServ: any) {
    const sql = db('q4u_queue')
      .select('vn')
      .where('date_serv', dateServ);
    return sql;
  }

  markPending(db: knex, queueId: any, servicePointId: any) {
    return db('q4u_queue')
      .where('queue_id', queueId)
      .update({ mark_pending: 'Y', pending_to_service_point_id: servicePointId });
  }

  getDuplicatedQueueInfo(db: knex, queueId: any) {
    return db('q4u_queue as q')
      .select('q.*', 'sp.department_id')
      .join('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .where('q.queue_id', queueId)
      .limit(1);
  }

  getCurrentQueueList(db: knex, dateServ: any) {

    const sql = `
    select a.*, r.room_name, r.room_number, q.queue_number, sp.service_point_name,
     p.title, p.first_name, p.last_name, p.hn,
    (
      select count(*) as total
      from q4u_queue as qx
      where qx.service_point_id=a.service_point_id
      and qx.room_id is null
      and qx.date_serv=?
      and qx.is_cancel != 'Y'
    ) as total
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

    return db.raw(sql, [dateServ, dateServ]);
  }


  getPrintInfo(db: knex, queueId: any) {
    const sql = `
    select q.hn, q.vn, q.queue_id, q.queue_interview, q.queue_number, q.queue_running, q.date_serv, q.time_serv,
    sp.service_point_name, sp.local_code, q.date_create, ps.first_name, ps.last_name,
    (select hosname from q4u_system limit 1) as hosname,
    (select hoscode from q4u_system limit 1) as hosid,
    (
      select count(*) from q4u_queue where queue_id<? and room_id is null
      and service_point_id=q.service_point_id and date_serv=q.date_serv
    ) as remain_queue, p.priority_name
    from q4u_queue as q
    inner join q4u_service_points as sp on sp.service_point_id=q.service_point_id
    inner join q4u_person as ps on ps.hn=q.hn
    left join q4u_priorities as p on p.priority_id=q.priority_id
    where q.queue_id=?
    `;
    return db.raw(sql, [queueId, queueId]);
  }

  getResponseQueueInfo(db: knex, queueIds: any[]) {

    const sqlHospname = db('q4u_system').select('hosname').as('hosname');
    const sqlHoscode = db('q4u_system').select('hoscode').as('hosid');

    return db('q4u_queue as q')
      .select('q.hn', 'q.vn', 'q.queue_id', 'q.queue_number', 'q.queue_interview', 'q.queue_running', 'q.date_serv',
        'sp.service_point_name', 'sp.local_code as service_point_code',
        'q.date_create', 'sp.department_id', 'p.priority_name', 'p.priority_id', 'r.room_name', 'r.room_number',
        sqlHoscode, sqlHospname)
      .leftJoin('q4u_queue_group_detail as qg', 'qg.queue_id', 'q.queue_id')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .leftJoin('q4u_priorities as p', 'p.priority_id', 'q.priority_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'qg.room_id')
      .whereIn('q.queue_id', queueIds);
  }

  apiGetCurrentQueueByHN(db: knex, hn: any, servicePointId: any) {
    return db('q4u_queue as q')
      .select('q.room_id', 'q.queue_id', 'q.queue_number', 'pr.priority_name', 'r.room_number')
      .leftJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .where('q.hn', hn)
      .where('q.service_point_id', servicePointId)
      .orderBy('q.queue_id', 'DESC')
      .limit(1);
  }

  apiGetCurrentQueue(db: knex, queueId: any) {
    return db('q4u_queue as q')
      .select('q.room_id', 'q.queue_id', 'q.queue_number', 'pr.priority_name', 'r.room_number')
      .leftJoin('q4u_priorities as pr', 'pr.priority_id', 'q.priority_id')
      .leftJoin('q4u_service_rooms as r', 'r.room_id', 'q.room_id')
      .where('q.queue_id', queueId)
      .orderBy('q.queue_id', 'DESC')
      .limit(1);
  }

  getCurrentQueue(db: knex, hn: any) {
    return db('q4u_queue')
      .where('hn', hn)
      .orderBy('queue_id', 'DESC')
      .limit(1);

  }

  getVisitHistoryList(db: knex, dateServe: any, servicePointId, query, limit, offset) {
    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .select('q.*', 'p.*', 's.local_code')
      .join('q4u_person as p', 'p.hn', 'q.hn')
      .join('q4u_service_points as s', 's.service_point_id', 'q.service_point_id')
      .where('q.date_serv', dateServe);

    if (servicePointId) {
      sql.where('q.service_point_id', servicePointId);
    }

    if (query) {
      sql.where((w) => {
        w.orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhere('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query);
      });
      const _arrQuery = query.split(' ');
      if (_arrQuery.length == 2) {
        sql.where((w) => {
          w.orWhere('p.first_name', 'like', `%${_arrQuery[0]}%`)
            .orWhere('p.last_name', 'like', `%${_arrQuery[1]}%`);
        });
      }
    }
    sql.orderBy('q.queue_id', 'DESC')
      .limit(limit)
      .offset(offset);
    return sql;
  }

  getVisitHistoryTotal(db: knex, dateServe: any, servicePointId, query) {

    const _query = `%${query}%`;
    const sql = db('q4u_queue as q')
      .count('*').as('total')
      .join('q4u_person as p', 'p.hn', 'q.hn')
      .where('q.date_serv', dateServe);

    if (servicePointId) {
      sql.where('q.service_point_id', servicePointId);
    }

    if (query) {
      sql.where((w) => {
        w.orWhere('p.first_name', 'like', _query)
          .orWhere('p.last_name', 'like', _query)
          .orWhere('q.hn', 'like', _query)
          .orWhere('q.queue_number', 'like', _query);
      });
      const _arrQuery = query.split(' ');
      if (_arrQuery.length == 2) {
        sql.where((w) => {
          w.orWhere('p.first_name', 'like', `%${_arrQuery[0]}%`)
            .orWhere('p.last_name', 'like', `%${_arrQuery[1]}%`);
        });
      }
    }
    return sql;
  }

  getNextQueue(db: knex, servicePointId: number, dateServ, limit: number = 5) {
    return db('q4u_queue')
      .whereNull('room_id')
      .where('service_point_id', servicePointId)
      .where('date_serv', dateServ)
      .where('is_cancel', 'N')
      .where('is_completed', 'N')
      .whereNot('mark_pending', 'Y')
      .orderBy('queue_running', 'ASC')
      .limit(limit);
  }

  getNextQueueDepartment(db: knex, departmentId: number, dateServ, limit: number = 5) {
    const sql = db('q4u_queue as q')
      .join('q4u_service_points as sp', 'sp.service_point_id', 'q.service_point_id')
      .whereNull('q.room_id')
      .where('sp.department_id', departmentId)
      .where('q.date_serv', dateServ)
      .where('q.is_cancel', 'N')
      .where('q.is_completed', 'N')
      .whereNot('q.mark_pending', 'Y')
      .orderBy('q.queue_running', 'ASC')
      .limit(limit);
    return sql;

  }

  getTokenNHSO(db: knex) {
    return db('q4u_nhso')
      .limit(1);
  }
}
