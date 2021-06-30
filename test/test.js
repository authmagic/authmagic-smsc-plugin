const assert = require('assert');
const _ = require('lodash');
const moment = require('moment');
const plugin = require('../plugin');
const {
  parseSMSTableResponse,
  ruleToRestrictRetryRequestsPerPeriodInSeconds,
  ruleLimitingNumberOfRequestsForPeriodInMinutes,
} = require('../rateLimit');

const options = {
  "user": "+380976290333",
  "redirectUrl": "http://127.0.0.1:3000/check.html",
  "params": {"r": 0.3058214819068661},
  "ekey": "43adc05879de401ee72b5639f391a2b8:cba34093e0c776f8362deff2e8482ef6581478e47dec57fa5fe6e424a4f2872448ca04e5bb7c6ee7bbc4ea1ce6791f9a7d7c69faf9d4e5ed1f91c064f52c85c44293ee73e9c8e35b5464eac85aad8d4f8b3df4ccca822a0bb074134997a6f361d45a5f8d1b468b8dbca3910ac1305377dd09db203bf10354e90294adf023d444f38319184764ca1519e4ee5ad5e80d24c5975f57121241aaf6eb6f92285c11e061752e7e9ca9770f6fa51282e39099255ac9f41b5e1c43d050aceb5e6e111f6f9be827dc8ca0a8c4351d67357007d828",
  "securityKey": "255293",
  "config": {
    "port": 3000,
    "core": {"name": "authmagic-timerange-stateless-core"},
    "plugins": {"authmagic-smsc-plugin": {"name": "authmagic-smsc-plugin"}},
    "params": {
      "authmagic-timerange-stateless-core": {
        "key": "faebc92cdf3939d1",
        "sendKeyPlugin": "authmagic-smsc-plugin",
        "expiresIn": "20m",
        "refreshExpiresIn": "2d",
        "securityKeyRule": {"length": 6, "charset": "numeric"}
      },
      "authmagic-smsc-plugin": {
        "isTest": true,
        "isLinkEnabled": true,
        "smsc": {"login": "", "password": ""},
        "shortUrl": {
          "isTurnedOn": false,
          "provider": "bit.ly",
          "params": {"login": "yyy", "apiKey": "xxx"}
        },
        "isLimiterEnabled": true,
        "samePhoneMinTimeoutSeconds": 15,
        "samePhoneMaxMessagesPerInterval": 10,
        "limiterIntervalMinutes": 60
      }
    },
    "theme": {"name": "authmagic-link-email-phone-bootstrap-theme"}
  }
};

describe('Plugin', function() {
  it('should send sms', function(done) {
    plugin(options, require('../static/template.js'), (r) => r)
      .then((res) => {
        assert(_.isEqual(res, { phones: '380976290333', mes: 'To authorize enter 25-52-93' }));
        done();
      })
      .catch(function(e) {
        console.log(e.toString());
        assert.ok(false);
        done();
      });
  });
  it('should shortify link with bit.ly', function(done) {
    plugin(_.merge(options, {
      config: {
        params: {
          'authmagic-smsc-plugin': {
            shortUrl: {
              isTurnedOn: true,
              params: {
                apiKey: process.env.BITLY_API_KEY,
              }
            }
          }
        }
      }
    }), require('../static/template.js'), (r) => r)
      .then((res) => {
        const match = /click (http.+)$/.exec(res.mes);
        if(match && match.length>1) {
          assert.ok(true);
        }
        done();
      })
      .catch(function(e) {
        console.log(e.toString());
        assert.ok(false);
        done();
      });
  });
  it('should fail in case of the wrong api key for bit.ly', function(done) {
    plugin(_.merge(options, {
      config: {
        params: {
          'authmagic-smsc-plugin': {
            shortUrl: {
              isTurnedOn: true,
              params: {
                apiKey: 'xyzxyz',
              }
            }
          }
        }
      }
    }), require('../static/template.js'), (r) => r)
      .then((res) => {
        assert(_.isEqual(res, { phones: '380976290333', mes: 'To authorize enter 25-52-93' }));
        done();
      })
      .catch(function(e) {
        console.log(e.toString());
        assert.ok(false);
        done();
      });
  });
  it('should fail in case of timeout for bit.ly', function(done) {
    plugin(_.merge(options, {
      config: {
        params: {
          'authmagic-smsc-plugin': {
            shortUrl: {
              isTurnedOn: true,
              timeout: 20, // 20ms
              params: {
                apiKey: process.env.BITLY_API_KEY,
              }
            }
          }
        }
      }
    }), require('../static/template.js'), (r) => r)
      .then((res) => {
        assert(_.isEqual(res, { phones: '380976290333', mes: 'To authorize enter 25-52-93' }));
        done();
      })
      .catch(function(e) {
        console.log(e.toString());
        assert.ok(false);
        done();
      });
  });
  it('should fail in case of timeout for bit.ly isLinkEnabled=false', function(done) {
    plugin(_.merge(options, {
      config: {
        params: {
          'authmagic-smsc-plugin': {
            shortUrl: {
              isTurnedOn: true,
              timeout: 20, // 20ms
              params: {
                apiKey: process.env.BITLY_API_KEY,
              }
            }
          }
        }
      }
    }), require('../static/template.js'), (r) => r)
      .then((res) => {
        assert(_.isEqual(res, { phones: '380976290333', mes: 'To authorize enter 25-52-93' }));
        done();
      })
      .catch(function(e) {
        console.log(e.toString());
        assert.ok(false);
        done();
      });
  });
});

describe('rate limit', function() {
  const now = moment().format('DD.MM.YYYY HH:mm:ss');

  it('parseSMSTableResponse', function() {
    const SMSTable = 'Status = 1, check_time = 28.06.2021 15:55:47, send_date = 28.06.2021 15:55:44, phone = 88002000600, mccmnc = 25503, country = Украина, operator = Kyivstar, region = , cost = 0.385, sender_id = OLLYFOOD, status_name = Доставлено, message = 78-74-08, type = 0, ID = 206113, int_id = 401671913, sms_cnt = 1, format = 0, crc = 307589946\n' +
      'Status = 1, check_time = 28.06.2021 15:54:46, send_date = 28.06.2021 15:54:43, phone = 88002000600, mccmnc = 25503, country = Украина, operator = Kyivstar, region = , cost = 0.385, sender_id = OLLYFOOD, status_name = Доставлено, message = 78-87-57, type = 0, ID = 206112, int_id = 401656822, sms_cnt = 1, format = 0, crc = 1340818552';
    const parsedSMSTable = parseSMSTableResponse(SMSTable);
    const expected = [
      {
        ID: '206113',
        Status: '1',
        check_time: '28.06.2021 15:55:47',
        cost: '0.385',
        country: 'Украина',
        crc: '307589946',
        format: '0',
        int_id: '401671913',
        mccmnc: '25503',
        message: '78-74-08',
        operator: 'Kyivstar',
        phone: '88002000600',
        region: '',
        send_date: '28.06.2021 15:55:44',
        sender_id: 'OLLYFOOD',
        sms_cnt: '1',
        status_name: 'Доставлено',
        type: '0'
      },
      {
        ID: '206112',
        Status: '1',
        check_time: '28.06.2021 15:54:46',
        cost: '0.385',
        country: 'Украина',
        crc: '1340818552',
        format: '0',
        int_id: '401656822',
        mccmnc: '25503',
        message: '78-87-57',
        operator: 'Kyivstar',
        phone: '88002000600',
        region: '',
        send_date: '28.06.2021 15:54:43',
        sender_id: 'OLLYFOOD',
        sms_cnt: '1',
        status_name: 'Доставлено',
        type: '0'
      }
    ];
    assert.deepEqual(parsedSMSTable, expected);
  });

  it('ruleToRestrictRetryRequestsPerPeriodInSeconds', function() {
    const params = options.config.params['authmagic-smsc-plugin'];
    const send_date = moment().subtract(20, 'seconds').format('DD.MM.YYYY HH:mm:ss');

    assert.deepEqual(
      ruleToRestrictRetryRequestsPerPeriodInSeconds([{ send_date }], params),
      true,
    );
    assert.deepEqual(
      ruleToRestrictRetryRequestsPerPeriodInSeconds([{ send_date: now }], params),
      false,
    );
  });

  it('ruleLimitingNumberOfRequestsForPeriodInMinutes', function() {
    const params = options.config.params['authmagic-smsc-plugin'];
    const send_date = moment().subtract(65, 'minutes').format('DD.MM.YYYY HH:mm:ss');

    assert.deepEqual(
      ruleLimitingNumberOfRequestsForPeriodInMinutes([{ send_date: now }], params),
      true,
    );
    assert.deepEqual(
      ruleLimitingNumberOfRequestsForPeriodInMinutes(_.fill(new Array(11), { send_date: now }), params),
      false,
    );
    assert.deepEqual(
      ruleLimitingNumberOfRequestsForPeriodInMinutes(_.fill(new Array(11), { send_date }), params),
      true,
    );
  });
});
