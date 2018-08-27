module.exports = function({url, securityKey}) {
  const splitBy = (inp, step = 2, separator = "-") =>
    inp.toString().split("").reduce((acc, val, index) => acc + (index%step || index===0 ? val : separator+val), "");

  if(url) {
    return `To authorize enter ${splitBy(securityKey)} or click ${url}`;
  }

  return `To authorize enter ${splitBy(securityKey)}`;
};