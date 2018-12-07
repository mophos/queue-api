import * as knex from 'knex';

export class MbaseModel {

    getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
        var sql = db('opd_visits as a')
            .select('a.VISIT_ID as vn',
                'a.hn',
                db.raw('DATE(a.REG_DATETIME) as date_serv'),
                db.raw('time(a.REG_DATETIME) as time_serv'),
                'a.UNIT_REG as clinic_code',
                'b.UNIT_NAME as clinic_name',
                db.raw('"" as title'),
                'd.FNAME as first_name',
                'd.LNAME as last_name',
                'd.BIRTHDATE as birthdate',
                'd.SEX as sex',
                db.raw('"" as his_queue'))
            .innerJoin('service_units as b', 'a.UNIT_REG', 'b.UNIT_ID')
            .innerJoin('cid_hn as c', 'a.HN', 'c.HN')
            .innerJoin('population as d', 'c.CID', 'd.CID')
            .whereRaw('a.REG_DATETIME>=?', [dateServ])
            .whereIn('b.unit_id', localCode)
            .whereNotIn('a.VISIT_ID', vn);

        if (servicePointCode) {
            sql.where('b.unit_id', servicePointCode);
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
                var _where = w.where('a.hn', query);
                if (firstName && lastName) {
                    _where.orWhere(x => x.where('d.FNAME', 'like', firstName).where('pt.lname', 'like', lastName))
                }
                return _where;
            });

        }

        return sql.limit(limit)
            .offset(offset)
            .orderBy('a.REG_DATETIME', 'asc');

    }

    getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
        var sql = db('opd_visits as a')
            .select(db.raw('count(*) as total'))
            .innerJoin('service_units as b', 'a.UNIT_REG', 'b.UNIT_ID')
            .innerJoin('cid_hn as c', 'a.HN', 'c.HN')
            .innerJoin('population as d', 'c.CID', 'd.CID')
            .whereRaw('a.REG_DATETIME>=?', [dateServ])
            .whereIn('b.unit_id', localCode)
            .whereNotIn('a.VISIT_ID', vn);

        if (servicePointCode) {
            sql.where('b.unit_id', servicePointCode);
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
                var _where = w.where('a.hn', query);
                if (firstName && lastName) {
                    _where.orWhere(x => x.where('d.FNAME', 'like', firstName).where('pt.lname', 'like', lastName))
                }
                return _where;
            });

        }

        return sql.orderBy('a.REG_DATETIME', 'asc');
    }

}