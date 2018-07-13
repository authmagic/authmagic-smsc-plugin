# authmagic-smsc-plugin
Plugin for <a href="https://github.com/authmagic/authmagic">authmagic</a> to send authorization links on sms via <a href="https://smsc.ua">smsc</a> service. It works with <a href="https://github.com/authmagic/authmagic-timerange-stateless-core">authmagic-timerange-stateless-core</a>.

## Installation
Check <a href="https://github.com/authmagic/authmagic-cli">authmagic-cli</a>
```
authmagic install authmagic-smsc-plugin
```

## How it works
User receives an sms and then by clicking on it gets token and authmagic redirects him back to application.
<img src="https://github.com/authmagic/authmagic/blob/master/docs/images/authmagic-smsc.jpg?raw=true" width="350px" />

## Params
Plugin depends on the <a href="https://github.com/rmdm/node-smsc">node-smsc</a>, params are the same.
