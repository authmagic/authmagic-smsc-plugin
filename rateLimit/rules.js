const _ = require('lodash');
const moment = require('moment');

const ruleToRestrictRetryRequestsPerPeriodInSeconds = (sms, { samePhoneMinTimeoutSeconds }) => !_.some(
  sms,
  ({ send_timestamp }) => moment()
    .subtract(samePhoneMinTimeoutSeconds, 'seconds')
    .isBefore(moment(send_timestamp * 1000)),
);

const ruleLimitingNumberOfRequestsForPeriodInMinutes = (sms, { limiterIntervalMinutes, samePhoneMaxMessagesPerInterval }) => _.filter(
  sms,
  ({ send_timestamp }) => moment()
    .subtract(limiterIntervalMinutes, 'minutes')
    .isBefore(moment(send_timestamp * 1000)),
).length < samePhoneMaxMessagesPerInterval;

module.exports = {
  ruleToRestrictRetryRequestsPerPeriodInSeconds,
  ruleLimitingNumberOfRequestsForPeriodInMinutes,
};
