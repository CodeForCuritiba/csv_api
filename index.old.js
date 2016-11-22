// BASE SETUP
// =============================================================================

const env = process.env.NODE_ENV || 'development';

const { readFileSync } = require('fs');

// the packages we need
const express    = require('express');        // call express

// loading custom functions
require('./utils');

const app        = express();                 // define our app using express

// set the view engine to ejs
app.set('view engine', 'ejs');

// LOAD MODELS
// =============================================================================




// READ CONFIG
// =============================================================================
let config = undefined;
try {

  config = require(process.env.CONFIG || './config.json'); 

  if (config !== undefined && config.hasOwnProperty('base')) {
    console.log('********************************************************************************');
    console.log('Loaded configs:');
    console.log(config);
    console.log('********************************************************************************');
  } else {
    throw new Exception();
  }
} catch (e) {
  console.log(`CRITICAL ERROR! Couldn't load config.json!`);
  console.log(e);
  console.log('Application will exit.');
  process.exit();
}

const base = config.base;

const database = config.database;
mongoose.connect(database);

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
    res.render('pages/index',{
        base: base,
        domain: req.protocol + '://' + req.get('host')
    });
});

if (base.hasOwnProperty('csv') && base.csv.length > 0) {
  for(let i = 0; i < base.csv.length; i++) {
    const csv = base.csv[i];
    if (csv.hasOwnProperty('slug')) {

      if (!ItemModels.hasOwnProperty(csv.slug)) {
        ItemModels[csv.slug] = mongoose.model(csv.slug, itemSchema);
      }

      const ItemModel = ItemModels[csv.slug];

      router.get('/' + csv.slug, function(req, res) {
          res.json( base );   
      });

      router.get('/' + csv.slug + '/item', function(req, res) {
        const find = (req.query.find) ? JSON.parse(req.query.find) : {};
        find['base'] = csv.slug;
        ItemModel.findOne(find, function (err,item) {
          if (err) {
            res.json(false);   
          } else {
            res.json(item);   
          }
        })
      });

      router.get('/' + csv.slug + '/items', function(req, res) {
        const find = (req.query.find) ? JSON.parse(req.query.find) : {};
        find['base'] = csv.slug;
        const options = {'limit': 30};
        if (req.query.limit) options['limit'] = 1 * req.query.limit;
        if (req.query.order) options['order'] = req.query.order;
        if (req.query.skip) options['skip'] = req.query.skip;
        console.log(find,options);
        ItemModel.find(find, {}, options, function (err,items) {
          if (err) {
            res.json(false);   
          } else {
            res.json(items);   
          }
        })
      });

      router.get('/' + csv.slug + '/fields', function(req, res) {
        const find = {};
        find['slug'] = csv.slug;
        CsvModel.findOne(find, function(err, doc) {
          if (err) {
            res.json(false);   
          } else {
            res.json(doc.fields);   
          }
        })
      });

      router.get('/' + csv.slug + '/:field', function(req, res) {
        ItemModel.aggregate(    [
          { '$group': { '_id': '$' + req.params.field } },
          { '$limit': 200 }
        ],function(err, results) {
          if (err) {
            res.json(false);   
          } else {
            const values = [];
            for (const i = results.length - 1; i >= 0; i--) {
              values.push(results[i]['_id']);
            };
            res.json(values);   
          }
        });
      });

    }
  }
}


// ROUTES FOR OUR API
// =============================================================================
const fs = require('fs')
  , util = require('util')
  , stream = require('stream')
  , request = require('request')
  , es = require('event-stream');

router.get('/sync', function(req, res) {

  let lineNr = 0;
  if (base.hasOwnProperty('csv') && base.csv.length > 0) {
    for(let i = 0; i < base.csv.length; i++) {
      const csv = base.csv[i];

      if (csv.hasOwnProperty('url')) {
        const url = csv.url;

        const separator = (csv.hasOwnProperty('separator')) ? csv.separator : ';';
        const line_validator = (csv.hasOwnProperty('line_validator')) ? csv.line_validator : /^[-\s]+$/g;

        const fields = [];
        const items = [];

        CsvModel.findOneAndUpdate(
          { 'slug' : csv.slug },
          csv,
          { 'new': true, 'upsert': true },
          function(err, csv) {
            if (err) {
              console.log(err);
              //TODO
            }

            if (!ItemModels.hasOwnProperty(csv.slug)) {
              ItemModels[csv.slug] = mongoose.model(csv.slug, itemSchema);
            }

            const ItemModel = ItemModels[csv.slug];
            ItemModel.remove({ base: csv.slug }, function(err) {
              if (err) {
                console.log(err);
                //TODO
              }

              const s = request({url: url})
                .pipe(es.split())
                .pipe(es.mapSync(function(line){

                  // pause the readstream
                  s.pause();

                  lineNr += 1;

                  // process line here and call s.resume() when rdy
                  // function below was for logging memory usage
                  line = line.trim();

                  if (fields.length == 0 && line.length > 0) {
                    const field_names = line.split(separator);
                    for(let j = 0; j < field_names.length; j++) {
                      const field_name = field_names[j];

                      fields.push({ name: field_name});
                    }

                    csv.fields = fields;
                    csv.save();

                  } else {

                    const field_values = line.split(separator);

                    if (field_values.length > 0 && !line_validator.test(field_values[0])) {
                      const item = { base: csv.slug };

                      for(let j = 0; j < field_values.length; j++) {
                        item[fields[j].name] = field_values[j].trim();
                      }

                      items.push(item);
                      itemObj = new ItemModel(item);
                      itemObj.save();
                    }

                  }

                  if (config.hasOwnProperty('max_parsing_lines') && lineNr >= config.max_parsing_lines) s.close();

                  // resume the readstream, possibly from a callback
                  s.resume();
                })
                .on('error', function(e){
                  res.json({ success: false, fields: fields, nb_items: items.length, message: 'Error while reading file.' + e });   
                  console.log('Error while reading file.',e);

                })
                .on('end', function(){
                  res.json({ success: false, fields: fields, nb_items: items.length});   
                  console.log('Read entire file.')
                })
              );

            });

          }
        );
      }
    }
  }
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
const port = process.env.PORT || (config.hasOwnProperty('port') ? config.port : 8080);        // set our port
app.listen(port);
console.log('Magic happens on port ' + port);

