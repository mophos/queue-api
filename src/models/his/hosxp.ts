import * as knex from 'knex';

export class HosxpModel {

  testConnection(db: knex) {
    return db.raw(`select 'Q4U Work'`);
  }

  getPatientInfo(db: knex, cid: any) {
    return db('patient')
      .select('hn', 'fname as first_name', 'pname as title', 'sex', 'lname as last_name', 'birthday as birthdate')
      .where('cid', cid).limit(1);
  }

  getPatientInfoWithHN(db: knex, hn: any) {
    return db('patient')
      .select('hn', 'fname as first_name', 'pname as title', 'sex', 'lname as last_name', 'birthday as birthdate')
      .where('hn', hn).limit(1);
  }

  getHISQueue(db: knex, hn: any, dateServ: any) {
    return db('ovst')
      .select('oqueue as queue')
      .where('hn', hn)
      .where('vstdate', dateServ)
      .orderBy('vn', 'DESC')
      .limit(1)
  }

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
        'o.main_dep as clinic_code', 'k.department as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.main_dep_queue as his_queue')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.main_dep', localCode)
      .whereNotIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('o.main_dep', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.main_dep', localCode)
      .whereNotIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('o.main_dep', servicePointCode);
      }
    }

    return sql;
  }

  getVisitHistoryList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
        'o.main_dep as clinic_code', 'k.department as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.main_dep_queue as his_queue')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.main_dep', localCode)
      .whereIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('o.main_dep', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitHistoryTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.main_dep', localCode)
      .whereIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('o.main_dep', servicePointCode);
      }
    }

    return sql;
  }
}
