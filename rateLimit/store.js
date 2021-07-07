const _ = require('lodash');
const fetch = require('node-fetch');
const moment = require('moment');
const querystring = require('querystring');

const defaultGetOfflineData = () => ({ status: 1, send_timestamp: _.round(moment() / 1000) })

function RateLimiterStore({ storeTTLMinutes, cnt, login, psw, getOfflineData = defaultGetOfflineData }) {
  const store = {};

  const addPhoneInfo = (phone, info) => {
    store[phone].push(info);
  };

  const clearPhoneInfo = phone => {
    delete store[phone];
  };

  const setPhoneInfo = (phone, info) => {
    store[phone] = info;
    setTimeout(() => clearPhoneInfo(phone), storeTTLMinutes * 60 * 1000);
  };

  const fetchPhoneInfo = async phone => {
    const queryParams = { login, psw, phone, cnt, fmt: 3, charset: 'utf-8' };
    const url = `https://smsc.ru/sys/get.php?get_messages=1&${querystring.stringify(queryParams)}`

    try {
      const response = await fetch(url);
      const smsList = await response.json();
      const filteredSmsList = _.filter(smsList, { status: 1 });

      if (smsList.error || filteredSmsList.length === 0) {
        return [getOfflineData(phone)];
      }

      return filteredSmsList;
    } catch (err) {
      return [getOfflineData(phone)];
    }
  };

  this.getPhoneInfo = async phone => {
    if (_.has(store, phone)) {
      setTimeout(() => addPhoneInfo(phone, getOfflineData(phone)), 0);

      return store[phone];
    }

    const responseInfo = await fetchPhoneInfo(phone);
    setTimeout(() => setPhoneInfo(phone, responseInfo), 0);

    return store[phone] || [];
  };
};

module.exports = RateLimiterStore;
