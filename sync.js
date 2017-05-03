#!/usr/bin/env node

'use strict'

const bluebird = require('bluebird');
global.Promise = bluebird;

const config = (process.env.CONFIG) ? JSON.parse(process.env.CONFIG) : require('./config.json');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.database);
const { ItemModel, CSVModel } = require('./models');

const request = require('request');
const iconv = require('iconv-lite');
const csvParser = require('csv-parser');
const _ = require('lodash');
const snappy = require('snappy')

// USING MONGO LIBRARY
// 2016-11-26, Curitiba - Brazil // @quagliato
//const mongodb = require('mongodb');
const mongoskin = require('mongoskin');

function sync(config, CSVModel, ItemModel) {
  const insertModel = (csv, headers) => {
    const separator = csv.separator || ';';
    const find = { 'slug' : csv.slug };
    const opt = { 'new': true, 'upsert': true }
    
    csv.fields = _.map(_.split(headers, separator), (header) => {
      return {name: header};
    });

    return CSVModel.findOneAndUpdate(find, csv, opt)
      .then(result => {
        return result.save();
      })
      .catch(err => {
        console.error('On add headers', err);
      })
  };


  let n = 0;
  (function loop() {
    if (n < config.base.csv.length) {
      const csv = config.base.csv[n];
      n = n + 1;

      const separator = csv.separator || ';';
      const line_validator = new RegExp(csv.line_validator || /^[-\s]+$/g);
      const values = [];

      // The insertQueue will be filled until 1000 records.
      let insertQueue = [];
      // When the insertQueue reaches 1000 records, it will be inserted as
      // a batch.
      let insertBatches = [];

      let i = 0;

      console.log(`-- Parsing ${csv.slug}`);

      const dl = request({url: csv.url});
      dl.pipe(iconv.decodeStream('ISO-8859-1'))
      .pipe(iconv.encodeStream('utf8'))
      .pipe(csvParser({separator: separator,raw: false}))
      .on('headers', (headers) => {
        console.log("Fields:",headers);
        insertModel(csv, headers)
          .catch(err => {
            console.error('On add registers by batch operation', err);
          });
      })
      .on('data', (record => {

        i = i; // this line is here because next line bugs on heroku production

        if (config.hasOwnProperty('max_parsing_lines') && i>=config.max_parsing_lines) {
          dl.abort(); 
          return false;
        }

        i += 1;

        // Every 1000 records, the queue will be cleaned and its content will
        // be added as a batch.
        if ((i % 1000) === 0) {
          console.log(i + " records enqueued");
          let compress = snappy.compressSync(JSON.stringify(insertQueue));
          insertBatches.push(compress);
          insertQueue = [];
        }

        if (Object.keys(record).length > 0 && record[Object.keys(record)[0]] !== undefined && !line_validator.test(record[Object.keys(record)[0]])) {
          record['base'] = csv.slug;
          insertQueue.push(record);
        }

        return true;
      }))
      .on('end', () => {
        // insertLoop process the batches (groups of 1000 records)
        const mongoConnection = mongoskin.db(process.env.MONGODB_URI || config.database, {
          native_parser: true,
          auto_reconnect: true,
          poolSize: 5,
        });

        let insertLoop = function(index, callback){

          // If there's something left on the queue, insert it as a batch
          if (insertQueue.length > 0) {
            console.log(i + " records enqueued");
            let compress = snappy.compressSync(JSON.stringify(insertQueue));
            insertBatches.push(compress);
            insertQueue = [];
          }

          // When all batches are processed, call the callback
          if (index >= insertBatches.length) {
            return callback();
          }
          
          let batch = insertBatches[index];
          snappy.uncompress(batch, (err,decompressed) => {
            mongoConnection.collection('items').insert(JSON.parse(decompressed), (err, results) => {
              if (err) return false;
              if (results) console.log((index + 1)  + ' of ' + insertBatches.length + ' added!');
              index += 1;
              return insertLoop(index, callback);
            });
          })
        };


        ItemModel.remove({"base": csv.slug}).catch(err => { console.error(`On remove all from ${csv.slug}`)});

        return insertLoop(0, () => {
          console.log(`-- End parsing ${csv.slug} (${i} lines imported)`);
          loop();

          return true;
        });

      });
    } else {
      console.log('Exit');
      process.exit()
    }
  }());


return true;
}

//// EXECUTE EVERY 5 DAYS
var date = new Date();
var day = date.getUTCDate();
if (day % 5 === 0) {
  const base_json = process.env.BASE_JSON || config.base_json;
  if ( base_json ) {
    try {
      request(base_json, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          config.base = JSON.parse(body);

          console.log('Loading csv databases ...');
          sync(config, CSVModel, ItemModel);

        } else {
          console.log(error,response);
          process.exit()
        }
      });

    } catch (err) {
      console.log(err);
      process.exit()
    }
  } else {
    if ( config.base ) {
      console.log('Loading csv databases ...');
      sync(config, CSVModel, ItemModel);
    } else {
      console.log('No base defined');
      process.exit()
    }
  }
} else {
  console.log('Not today');
  process.exit()
}



