const path = require('path');
const querystring = require('querystring');
const fetch = require('node-fetch');
const _ = require('lodash');
const shorturl = require('shorturl-2');
const { BitlyClient } = require('bitly');
const bitly = require('bitly');
const pluginName = 'authmagic-smsc-plugin';

const getParams = ({config:iconfig}) => {
  return iconfig ? iconfig.params ? iconfig.params[pluginName] : null : null;
};

// TODO do not console.log
const shortify = async function(uri, provider, params) {
  switch(provider.toLowerCase()) {
    case 'bit.ly':
    case 'bitly':
      const bitly = new BitlyClient(params.apiKey, {});
      let result = {};
      try {
        result = await bitly.shorten(uri);
      } catch(e) {
        throw e;
      }
      return result.url;
    default:
      return new Promise((resolve, reject) => {
        shorturl(uri, provider, params, function(result) {
          if(_.isString(result)) {
            resolve(result);
          } else {
            reject(result);
          }
        });
      })
  }
};

const getMessage = async (options, template) => {
  const {ekey, redirectUrl, securityKey} = options;
  const { isLinkEnabled, shortUrl: {isTurnedOn, provider, params, timeout}} = getParams(options);
  const uri = `${redirectUrl}?ekey=${encodeURIComponent(ekey)}`;

  if(isTurnedOn && isLinkEnabled) {
    let shortUri;
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve(template({securityKey, params: options.params}));
      }, timeout || 5000);
      try {
        shortUri = await shortify(uri, provider, params);
        clearTimeout(timeoutId);
      } catch(e) {
        clearTimeout(timeoutId);
        resolve(template({securityKey, params: options.params}));
      }

      resolve(template({securityKey, url: shortUri, params: options.params}));
    });
  }

  return template({securityKey, params: options.params});
};

module.exports = function (options, template, action) {
  const user = options.user.replace(/[^\d]/g, '');
  const { smsc, isTest, ...otherParams } = getParams(options);
  if(_.isUndefined(template)) {
    template = require(path.resolve(`./static/${pluginName}/template.js`));
  }

  if(_.isUndefined(action)) {
    if(isTest) {
      action = console.log;
    } else {
      action = ({phones, mes}) => fetch(`https://smsc.ru/sys/send.php?${querystring.stringify({
        ...smsc,
        phones,
        mes,
        charset: 'utf-8',
      })}`)
    }
  }

  return getMessage(options, template)
    .then((mes) => {
      action({ phones: user, mes })
    })
    .catch(e => { console.log(e); return e; });
};
