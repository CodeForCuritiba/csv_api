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

      var i = 0;

      console.log(`-- Parsing ${csv.slug}`);

      ItemModel.remove({"base": csv.slug}).catch(err => { console.error(`On remove all from ${csv.slug}`)});

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

        if (config.hasOwnProperty('max_parsing_lines') && i=>config.max_parsing_lines) {
          dl.abort(); 
          return false;
        }

        i = i + 1;

//        console.log(record);

        if ((i % 10) == 0) console.log(i);

        if (Object.keys(record).length > 0 && record[Object.keys(record)[0]] !== undefined && !line_validator.test(record[Object.keys(record)[0]])) {
          record['base'] = csv.slug;
          let item = new ItemModel(record);
          item.save();
        }

        return true;
      }))
      .on('end', () => {
//        ItemModel.remove({"base": csv.slug}).catch(err => { console.error(`On remove all from ${csv.slug}`)});
//        ItemModel.insertMany(values);
        console.log(`-- End parsing ${csv.slug} (${i} lines imported)`);
        loop();

      });
    } else {
      console.log('Exit');
      process.exit()
    }
  }());


return true;
//  return Promise.map(config.base.csv, requestCSV);

}


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

