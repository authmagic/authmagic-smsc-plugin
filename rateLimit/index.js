const moment = require('moment');
const _ = require('lodash');
const querystring = require('querystring');
const fetch = require('node-fetch');

const ruleToRestrictRetryRequestsPerPeriodInSeconds = (sms, { samePhoneMinTimeoutSeconds }) => !_.some(
  sms,
  ({ send_date }) => moment()
    .subtract(samePhoneMinTimeoutSeconds, 'seconds')
    .isBefore(moment(send_date, 'DD.MM.YYYY HH:mm:ss')),
);

const ruleLimitingNumberOfRequestsForPeriodInMinutes = (sms, { limiterIntervalMinutes, samePhoneMaxMessagesPerInterval }) => _.filter(
  sms,
  ({ send_date }) => moment()
    .subtract(limiterIntervalMinutes, 'minutes')
    .isBefore(moment(send_date, 'DD.MM.YYYY HH:mm:ss')))
  .length <= samePhoneMaxMessagesPerInterval;

const rateLimitAllowedRules = [
  ruleToRestrictRetryRequestsPerPeriodInSeconds,
  ruleLimitingNumberOfRequestsForPeriodInMinutes,
];

const parseSMSTableResponse = responsedSms => _.map(
  _.split(responsedSms, '\n'),
  sms => _.fromPairs(_.map(
    _.split(sms, ','),
    value => _.map(_.split(value, '='), _.trim)
  ))
);

const checkRateLimitAllowed = async options => {
  const {
    smsc, phone, isLimiterEnabled, samePhoneMaxMessagesPerInterval,
  } = options;

  if (!isLimiterEnabled) {
    return true;
  }

  const result = await fetch(
    `https://smsc.ru/sys/get.php?get_messages=1&${querystring.stringify({
      ...smsc,
      phone,
      cnt: samePhoneMaxMessagesPerInterval,
      charset: 'utf-8',
    })}`,
  )
    .then(response => response.text())
    .then(text => parseSMSTableResponse(text))
    .then(smsList => _.reduce(rateLimitAllowedRules, (acc, rule) => acc ? rule(smsList, options) : acc, true));

  return result;
};

module.exports = {
  checkRateLimitAllowed,
  parseSMSTableResponse,
  ruleToRestrictRetryRequestsPerPeriodInSeconds,
  ruleLimitingNumberOfRequestsForPeriodInMinutes,
};
