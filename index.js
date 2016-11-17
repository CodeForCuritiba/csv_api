// BASE SETUP
// =============================================================================

// the packages we need
var express    = require('express');        // call express

// loading custom functions
require('./utils');

var app        = express();                 // define our app using express

// READ CONFIG
// =============================================================================
var config = undefined;
try {
  config = JSON.parse(readFile("config.json"));
  if (config !== undefined && config.hasOwnProperty('base')) {
    console.log("********************************************************************************");
    console.log("Loaded configs:");
    console.log(config);
    console.log("********************************************************************************");
  } else {
    throw new Exception();
  }
} catch (e) {
  console.log("CRITICAL ERROR! Couldn't load config.json!");
  console.log(e);
  console.log("Application will exit.");
  process.exit();
}

var base = config.base;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
    res.json({ message: 'Hooray! Welcome to our api! Coming soon a complete documentation' });   
});

if (base.hasOwnProperty('csv') && base.csv.length > 0) {
  for(var i = 0; i < base.csv.length; i++) {
    var csv = base.csv[i];
    if (csv.hasOwnProperty('slug')) {

      router.get('/' + csv.slug, function(req, res) {
          res.json( base );   
      });

      router.get('/' + csv.slug + '/item', function(req, res) {
          res.json({ 'res': {} });   
      });

      router.get('/' + csv.slug + '/items', function(req, res) {
          res.json({ 'res': [] });   
      });

      router.get('/' + csv.slug + '/fields', function(req, res) {
          res.json({ fields: ['col1','col2','col3'] });   
      });

      router.get('/' + csv.slug + '/:field', function(req, res) {
          res.json({ field: req.params.field });   
      });


    }
  }
}

router.get('/sync', function(req, res) {
    res.json({ success: true, message: 'Let\'s try' });   
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
var port = config.hasOwnProperty('port') ? config.port : 8080;        // set our port
app.listen(port);
console.log('Magic happens on port ' + port);

