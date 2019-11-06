import * as knex from 'knex';
var request = require("request");
export class KioskModel {

  tableName = 'q4u_priorities';

  nhso(data) {
    return new Promise((resolve: any, reject: any) => {
      var options = {
        method: 'POST',
        url: 'http://ucws.nhso.go.th/ucwstokenp1/UCWSTokenP1',
        agentOptions: {
          rejectUnauthorized: false
        },
        headers:
        {
          'content-type': 'text/xml'
        },
        body: data
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }

  triggerGet(url, hn, cid, localCode, servicePointId) {
    return new Promise((resolve: any, reject: any) => {
      const options = {
        method: 'GET',
        url: `${url}?hn=${hn}&cid=${cid}&localCode=${localCode}&servicePointId=${servicePointId}`,
        agentOptions: {
          rejectUnauthorized: false
        },
        headers:
        {
          'content-type': 'text/json'
        }
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }

  triggerPOST(url, hn, cid, localCode, servicePointId) {
    return new Promise((resolve: any, reject: any) => {
      const options = {
        method: 'POST',
        url: `${url}`,
        agentOptions: {
          rejectUnauthorized: false
        },
        headers:
        {
          'Content-Type': 'application/json'
        },
        body: {
          hn: hn,
          cid: cid,
          localCode: localCode,
          servicePointId: servicePointId
        },
        json: true
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }


}