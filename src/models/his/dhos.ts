import * as knex from 'knex';
export class DhosModel {

    getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
        var sql = db('opd_visit as o')
            .select('o.vn', 'o.hn', 'o.date_serv', 'o.time_serv',
                'o.clinic_code', 'o.clinic_name',
                'o.title', 'o.first_name', 'o.last_name',
                'o.birthdate', 'o.sex', 'o.his_queue')
            .where('o.date_serv', dateServ)
            .whereIn('o.clinic_code', localCode)
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
                _where.orWhere(x => x.where('o.first_name', 'like', firstName).where('o.last_name', 'like', lastName))
              }
              return _where;
            });
      
          } else {
            if (servicePointCode) {
              sql.where('o.clinic_code', servicePointCode);
            }
          }

        return sql.limit(limit)
            .offset(offset)
            .orderBy('o.time_serv', 'asc');

    }

    getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
        var sql = db('opd_visit as o')
            .select(db.raw('count(1) as total'))
            .where('o.date_serv', dateServ)
            .whereIn('o.clinic_code', localCode)
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
                _where.orWhere(x => x.where('o.first_name', 'like', firstName).where('o.last_name', 'like', lastName))
              }
              return _where;
            });
      
          }else {
            if (servicePointCode) {
              sql.where('o.clinic_code', servicePointCode);
            }
          }

        return sql.orderBy('o.clinic_code', 'asc');
    }

}