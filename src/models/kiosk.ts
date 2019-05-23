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


}