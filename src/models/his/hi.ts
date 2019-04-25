import * as knex from 'knex';

export class HiModel {

  testConnection(db: knex) {
    return db.raw(`select 'Q4U Work'`);
  }

  getPatientInfo(db: knex, cid: any) {
    return db('pt')
      .select('hn', 'fname as first_name', 'pname as title', 'male as sex', 'lname as last_name', 'brthdate as birthdate')
      .where('pop_id', cid).limit(1);
  }

  getPatientInfoWithHN(db: knex, hn: any) {
    return db('pt')
      .select('hn', 'fname as first_name', 'pname as title', 'male as sex', 'lname as last_name', 'brthdate as birthdate')
      .where('hn', hn).limit(1);
  }

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('date(vstdttm) as date_serv'), db.raw('time(vstdttm) as time_serv'),
        'o.cln as clinic_code', 'c.namecln as clinic_name', 'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.brthdate as birthdate', 'pt.male as sex', db.raw('"" as his_queue'))
      .innerJoin('cln as c', 'c.cln', 'o.cln')
      .innerJoin('pt', 'pt.hn', 'o.hn')
      .whereRaw('date(vstdttm)=?', [dateServ])
      .whereIn('o.cln', localCode)
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
        sql.where('o.cln', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vstdttm', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('pt', 'pt.hn', 'o.hn')
      .innerJoin('cln as c', 'c.cln', 'o.cln')
      .whereRaw('date(o.vstdttm)=?', [dateServ])
      .whereIn('o.cln', localCode)
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
        sql.where('o.cln', servicePointCode);
      }
    }

    return sql;
  }

  getVisitHistoryList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('date(vstdttm) as date_serv'), db.raw('time(vstdttm) as time_serv'),
        'o.cln as clinic_code', 'c.namecln as clinic_name', 'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.brthdate as birthdate', 'pt.male as sex', db.raw('"" as his_queue'))
      .innerJoin('cln as c', 'c.cln', 'o.cln')
      .innerJoin('pt', 'pt.hn', 'o.hn')
      .whereRaw('date(vstdttm)=?', [dateServ])
      .whereIn('o.cln', localCode)
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
        sql.where('o.cln', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vstdttm', 'asc');

  }

  getVisitHistoryTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('pt', 'pt.hn', 'o.hn')
      .innerJoin('cln as c', 'c.cln', 'o.cln')
      .whereRaw('date(o.vstdttm)=?', [dateServ])
      .whereIn('o.cln', localCode)
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
        sql.where('o.cln', servicePointCode);
      }
    }

    return sql;
  }
}