const path = require('path');
const querystring = require('querystring');
const fetch = require('node-fetch');
const _ = require('lodash');
const shorturl = require('shorturl-2');
const pluginName = 'authmagic-smsc-plugin';

const getParams = ({config:iconfig}) => {
  return iconfig ? iconfig.params ? iconfig.params[pluginName] : null : null;
};

const getMessage = (options, template) => {
  const {ekey, redirectUrl, securityKey} = options;
  const {shortUrl} = getParams(options);
  const url = `${redirectUrl}?ekey=${encodeURIComponent(ekey)}`;
  if(shortUrl.isTurnedOn) {
    return new Promise((resolve, reject) => {
      shorturl(url, shortUrl.provider, shortUrl.params, function(result) {
        if(_.isString(result)) {
          resolve(template({...options, url: result, securityKey}));
        } else {
          reject(result);
        }
      });
    })
  }

  return new Promise(resolve => resolve(template({securityKey})));
};

module.exports = function (options, template, action) {
  const user = options.user.replace(/[^\d]/g, '');
  const { smsc, isTest, timeout = 2000 } = getParams(options);
  if(_.isUndefined(template)) {
    template = require(path.resolve(`./static/${pluginName}/template.js`));
  }

  if(_.isUndefined(action)) {
    if(isTest) {
      action = console.log;
    } else {
      action = ({phones, mes}) => {
        function sendMessage() {
          return fetch(`https://smsc.ru/sys/send.php?${querystring.stringify({
            ...smsc,
            phones,
            mes,
            charset: 'utf-8',
          })}`)
          .then(res => {
            if (res.status === 200) {
              return res;
            } else {
              throw new Error(res.statusText);
            }
          })
          .catch(e => {
            console.log(e);
            setTimeout(() => {
              sendMessage();
            }, timeout);
          })
        }

        return sendMessage();
      }
    }
  }

  return getMessage(options, template)
    .then((mes) => action({phones: user, mes}))
    .catch(console.log);
};