import * as knex from 'knex';

export class MbaseModel {

    getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, limit: number = 20, offset: number = 0) {
        var sql = db('ovst as o')
            .select('o.vn', 'o.hn', db.raw('date(vstdttm) as date_serv'), db.raw('time(vstdttm) as time_serv'),
                'o.cln as clinic_code', 'c.namecln as clinic_name', 'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
                'pt.brthdate as birthdate', 'pt.male as sex', db.raw('"" as his_queue'))
            .innerJoin('cln as c', 'c.cln', 'o.cln')
            .innerJoin('pt', 'pt.hn', 'o.hn')
            .whereRaw('date(vstdttm)=?', [dateServ])
            .whereIn('o.cln', localCode)
            .whereNotIn('o.vn', vn);

        if (servicePointCode) {
            sql.where('o.cln', servicePointCode);
        }

        return sql.limit(limit)
            .offset(offset)
            .orderBy('o.vstdttm', 'asc');

    }

    getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any) {
        var sql = db('ovst as o')
            .select(db.raw('count(*) as total'))
            .innerJoin('pt', 'pt.hn', 'o.hn')
            .innerJoin('cln as c', 'c.cln', 'o.cln')
            .whereRaw('date(o.vstdttm)=?', [dateServ])
            .whereIn('o.cln', localCode)
            .whereNotIn('o.vn', vn);

        if (servicePointCode) {
            sql.where('o.cln', servicePointCode);
        }

        return sql.orderBy('o.vstdttm', 'asc');
    }

}