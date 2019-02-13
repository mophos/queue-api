import * as knex from 'knex';

export class HomcModel {

    testConnection(db: knex) {
        return db.raw(`select 'Q4U Work'`);
    }
    async getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, limit: number = 20, offset: number = 0) {
        let data = await db.raw(`select top '${limit}' o.regNo as vn, o.hn, convert(date,convert(char,o.registDate -5430000)) as date_serv, 
        substring(o.timePt,1,2)+':'+substring(o.timePt,3,2) as time_serv, 
        d.deptCode as clinic_code, rtrim(d1.deptDesc) as clinic_name, rtrim(t.titleName) as title, 
        rtrim(p.firstName) as first_name, rtrim(p.lastName) as last_name, p.birthDay as birthdate, 
        case when t.sex='ช' then 'ชาย' else 'หญิง' end as sex, '' as his_queue 
        from OPD_H as o 
        inner join PATIENT as p on p.hn = o.hn 
        inner join PTITLE as t on t.titleCode = p.titleCode 
        inner join Deptq_d as d on d.hn = o.hn and d.regNo=o.regNo
        inner join DEPT as d1 on d1.deptCode = d.deptCode 
        where convert(date,convert(char,o.registDate -5430000))='${dateServ}' and d.deptCode = '${servicePointCode}' order by o.registDate asc`);
        return data;
    }

    async getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any) {
        let data= await db.raw(`select count(*) as total from OPD_H as o 
        inner join PATIENT as p on p.hn = o.hn 
        inner join PTITLE as t on t.titleCode = p.titleCode 
        inner join Deptq_d as d on d.hn = o.hn and d.regNo=o.regNo
        inner join DEPT as d1 on d1.deptCode = d.deptCode where convert(date,convert(char,o.registDate -5430000))= '${dateServ}' 
        and d.deptCode = '${servicePointCode}' group by convert(date,convert(char,o.registDate -5430000))`);
        console.log(servicePointCode);
        return data;
    }

}