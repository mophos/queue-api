import * as knex from 'knex';
export class EzhospModel {

    getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, limit: number = 20, offset: number = 0) {
        var sql = db('view_opd_visit as o')
            .select('o.vn', 'o.hn', db.raw('o.date as date_serv'), db.raw('o.time as time_serv'),
                'o.dep as clinic_code', 'o.dep_name as clinic_name',
                'o.title', 'o.name as first_name', 'o.surname as last_name',
                'pt.birth as birthdate', 'o.sex', 'o.queue as his_queue')
            .where('o.date', dateServ)
            .whereIn('o.dep', localCode)
            .whereNotIn('o.vn', vn);

        if (servicePointCode) {
            sql.where('o.dep', servicePointCode);
        }

        return sql.limit(limit)
            .offset(offset)
            .orderBy('o.time', 'asc');

    }

    getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any) {
        var sql = db('opd_visit')
            .select(db.raw('count(1) as total'))
            .where('date', dateServ)
            .whereIn('dep', localCode)
            .whereNotIn('vn', vn);

        if (servicePointCode) {
            sql.where('dep', servicePointCode);
        }

        return sql.orderBy('dep', 'asc');
    }

}