import * as knex from 'knex';

export class HomcModel {

    testConnection(db: knex) {
        return db.raw(`select 'Q4U Work'`);
    }

    getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, limit: number = 20, offset: number = 0) {
        var sql = db('OPD_H as o')
            .select('o.regNo as vn', 'o.hn',
                db.raw('dbo.ymd2ce(o.registDate) as date_serv'),
                db.raw(`'substring(o.timePt,1,2)+':'+substring(o.timePt,3,2) as time_serv'`),
                'd.deptCode as clinic_code',
                db.raw('rtrim(d1.deptDesc) as clinic_name'),
                db.raw('rtrim(t.titleName) as title'),
                db.raw('rtrim(p.firstName) as first_name'),
                db.raw('rtrim(p.lastName) as last_name'),
                db.raw('dbo.ymd2ce(p.birthDay) as birthdate'),
                db.raw(`case when t.sex='ช' then 'ชาย' else 'หญิง' end as sex`),
                db.raw('"" as his_queue'))
            .innerJoin('PATIENT as p', 'p.hn', 'o.hn')
            .innerJoin('PTITLE as t', 't.titleCode', 'p.titleCode')
            .innerJoin('Deptq_d as d', 'd.regNo', 'o.regNo' && 'd.hn', 'o.hn')
            .innerJoin('DEPT as d1', 'd1.deptCode', 'd.deptCode')
            .whereRaw('dbo.ymd2ce(o.registDate)=?', [dateServ])
            .whereIn('d.deptCode', localCode)
            .whereNotIn('o.regNo', vn);

        if (servicePointCode) {
            sql.where('d.deptCode', servicePointCode);
        }

        return sql.limit(limit)
            .offset(offset)
            .orderBy('dbo.ymd2ce(o.registDate)', 'asc');

    }

    getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any) {
        var sql = db('OPD_H as o')
            .select(db.raw('count(*) as total'))
            .innerJoin('PATIENT as p', 'p.hn', 'o.hn')
            .innerJoin('PTITLE as t', 't.titleCode', 'p.titleCode')
            .innerJoin('Deptq_d as d', 'd.regNo', 'o.regNo' && 'd.hn', 'o.hn')
            .innerJoin('DEPT as d1', 'd1.deptCode', 'd.deptCode')
            .whereRaw('dbo.ymd2ce(o.registDate)=?', [dateServ])
            .whereIn('d.deptCode', localCode)
            .whereNotIn('o.regNo', vn);

        if (servicePointCode) {
            sql.where('d.deptCode', servicePointCode);
        }

        return sql.orderBy('dbo.ymd2ce(o.registDate)', 'asc');
    }

}