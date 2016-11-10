var API2Go = require('api2go');

// You can also instance a API object without a file, but informing the config
// object right here, like this:
var apiObj = new API2Go({ DEBUG_MODE: 1,
  NODEJS_LISTEN_PORT: 3000,
  API_FUNCTIONS_MAP: '_assets/functions-map.json',
  AUDIT_LOG: '_logs/audit.log',
  GENERAL_LOG: '_logs/general.log',
  DEBUG_LOG: '_logs/debug.log',
  MAIL_LOG: '_logs/mail.log',
  MAX_LOG_FILESIZE: '10485760',
  MAIL_HOST: 'xxxx',
  MAIL_PORT: 'xxxx',
  MAIL_USER: 'xxxx',
  MAIL_PASSWORD: 'xxxx',
  MAIL_SECURE: true,
  MAIL_IGNORE_TLS: true,
  MAIL_DEFAULT_FROM_USER: 'a@b.c' 
});

apiObj.registerFunction("test", function(payload, requestKey, callback, req, res){
  console.log(payload);
  var returnValues = {
    "status": "OK",
    "data": data
  };

  callback(returnValues);
});

// The API will start listen in the port you specified in the config.
apiObj.start();

