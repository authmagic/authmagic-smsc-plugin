const path = require('path');
const smsc = require('node-smsc');
const pluginName = 'authmagic-smsc-plugin';

module.exports = function ({user, redirectUrl, params, ekey, config:iconfig}) {
  const pluginConfig = iconfig ? iconfig.params ? iconfig.params[pluginName] : null : null;
  const smscInstance = smsc(pluginConfig);
  const mes = require(path.resolve(`./static/${pluginName}/template.js`))({user, redirectUrl, params, ekey});
  smscInstance.send({
    phones: user,
    mes: mes,
  });
};