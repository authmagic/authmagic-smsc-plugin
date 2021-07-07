const _ = require('lodash');
const RateLimiterStore = require('./store');
const rateLimitAllowedRules = require('./rules');

let rateLimiterStore = null;

const checkRateLimitAllowed = async options => {
  const {
    smsc, phone, isLimiterEnabled, samePhoneMaxMessagesPerInterval, limiterStoreTTLMinutes: storeTTLMinutes,
  } = options;

  if (!isLimiterEnabled) {
    return true;
  }

  if (!rateLimiterStore) {
    rateLimiterStore = new RateLimiterStore({
      ...smsc, storeTTLMinutes, cnt: samePhoneMaxMessagesPerInterval + 1,
    });
  }

  const smsList = await rateLimiterStore.getPhoneInfo(phone);
  const result = _.reduce(rateLimitAllowedRules, (acc, rule) => acc ? rule(smsList, options) : acc, true);

  return result;
};

module.exports = checkRateLimitAllowed;
