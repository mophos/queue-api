import * as knex from 'knex';

export class EzhospModel {

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
        'o.spclty as clinic_code', 'c.name as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.oqueue as his_queue')
      .innerJoin('spclty as c', 'c.spclty', 'o.spclty')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .where('o.vstdate', dateServ)
      .whereIn('o.spclty', localCode)
      .whereNotIn('o.vn', vn);

    if (servicePointCode) {
      sql.where('o.spclty', servicePointCode);
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('spclty as c', 'c.spclty', 'o.spclty')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .where('o.vstdate', dateServ)
      .whereIn('o.spclty', localCode)
      .whereNotIn('o.vn', vn);

    if (servicePointCode) {
      sql.where('o.spclty', servicePointCode);
    }

    return sql.orderBy('o.vsttime', 'asc');
  }

}