module.exports = {
  isTest: true,
  isLinkEnabled: true,
  smsc: {
    login: '',
    psw: ''
  },
  shortUrl: {
    // bit.ly would refuse url shortification if you would like to use localhost
    isTurnedOn: false,
    provider: 'bit.ly',
    params: {
      login: '',
      apiKey: ''
    }
  },
};
