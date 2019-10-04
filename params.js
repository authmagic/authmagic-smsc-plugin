module.exports = {
  isTest: true,
  smsc: {
    login: '',
    psw: ''
  },
  shortUrl: {
    // bit.ly would refuse url shortification if you would like to use localhost
    isLinkEnabled: true,
    isTurnedOn: false,
    provider: 'bit.ly',
    params: {
      login: '',
      apiKey: ''
    }
  },
};