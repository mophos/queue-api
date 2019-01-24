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

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
        'o.cur_dep as clinic_code', 'k.department as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.oqueue as his_queue')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.cur_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.cur_dep', localCode)
      .whereNotIn('o.vn', vn);

    if (servicePointCode) {
      sql.where('o.cur_dep', servicePointCode);
    }

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
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.cur_dep')
      .where('o.vstdate', dateServ)
      .whereIn('o.cur_dep', localCode)
      .whereNotIn('o.vn', vn);

    if (servicePointCode) {
      sql.where('o.cur_dep', servicePointCode);
    }

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
    }

    return sql.orderBy('o.vsttime', 'asc');
  }

}