import * as knex from 'knex';

export class HimproModel {

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('opd.opd as o')
      .select('j.pqueue as vn', 'o.hn', db.raw('o.regdate as date_serv'), db.raw('o.timestart as time_serv'),
        'o.sendScrRoom as clinic_code', 'k.roomname as clinic_name',
        'pt.pttitle as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.ptdob as birthdate', 'pt.ptsex as sex', 'i.queue as his_queue')
      .innerJoin('pt.pt as pt', 'pt.hn', 'o.hn')
      .innerJoin('hos.roomno as k', 'k.roomcode', 'o.sendScrRoom')
      .innerJoin('opd.oqueue as i', 'i.hn', 'o.hn')
      .innerJoin('pcu.pcu_seq as j', 'j.hn', 'o.hn')
      .where('o.regdate', dateServ)
      .whereIn('o.sendScrRoom', localCode)
      .whereNotIn('j.pqueue', vn);

    if (servicePointCode) {
      sql.where('o.sendScrRoom', servicePointCode);
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
      .orderBy('o.timestart', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('opd.opd as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('pt as pt', 'pt.hn', 'o.hn')
      .innerJoin('hos.roomno as k', 'k.roomcode', 'o.sendScrRoom')
      .innerJoin('pcu.pcu_seq as j', 'j.hn', 'o.hn')
      .where('o.regdate', dateServ)
      .whereIn('o.sendScrRoom', localCode)
      .whereNotIn('j.pqueue', vn);

    if (servicePointCode) {
      sql.where('o.sendScrRoom', servicePointCode);
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

    return sql.orderBy('o.timestart', 'asc');
  }

}
