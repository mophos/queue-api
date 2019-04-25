import * as knex from 'knex';

export class UniversalModel {

  testConnection(db: knex) {
    return db.raw(`select 'Q4U Work'`);
  }

  getPatientInfo(db: knex, cid: any) {
    return db('q4u_patient')
      .select('hn', 'first_name', 'title', 'sex', 'last_name', 'birthdate')
      .where('cid', cid).limit(1);
  }

  getPatientInfoWithHN(db: knex, hn: any) {
    return db('q4u_patient')
      .select('hn', 'first_name', 'title', 'sex', 'last_name', 'birthdate')
      .where('hn', hn).limit(1);
  }

  getHISQueue(db: knex, hn: any, dateServ: any) {
    return db('q4u')
      .select('his_queue as queue')
      .where('hn', hn)
      .where('date_serv', dateServ)
      .orderBy('vn', 'DESC')
      .limit(1)
  }

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('q4u')
      .select('*')
      .where('date_serv', dateServ)
      .whereIn('clinic_code', localCode)
      .whereNotIn('vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
        }
        return _where;
      });

    } else {
      if (servicePointCode) {
        sql.where('clinic_code', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('time_serv', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('q4u')
      .select(db.raw('count(*) as total'))
      .where('date_serv', dateServ)
      .whereIn('clinic_code', localCode)
      .whereNotIn('vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
        }
        return _where;
      });

    } else {
      if (servicePointCode) {
        sql.where('clinic_code', servicePointCode);
      }
    }

    return sql;
  }

  getVisitHistoryList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('q4u')
      .select('*')
      .where('date_serv', dateServ)
      .whereIn('clinic_code', localCode)
      .whereIn('vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
        }
        return _where;
      });

    } else {
      if (servicePointCode) {
        sql.where('clinic_code', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('time_serv', 'asc');

  }

  getVisitHistoryTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('q4u')
      .select(db.raw('count(*) as total'))
      .where('date_serv', dateServ)
      .whereIn('clinic_code', localCode)
      .whereIn('vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
        }
        return _where;
      });

    } else {
      if (servicePointCode) {
        sql.where('clinic_code', servicePointCode);
      }
    }

    return sql;
  }
}