#!/usr/bin/env node

'use strict'

const bluebird = require('bluebird');
global.Promise = bluebird;

const config = require(process.env.CONFIG || './config.json');

const mongoose = require('mongoose');
mongoose.connect(config.database);
const { ItemModel, CSVModel } = require('./models');

const request = require('request');
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

  const requestCSV = (csv) => {
    const separator = csv.separator || ';';
    const line_validator = new RegExp(csv.line_validator || /^[-\s]+$/g);
    const values = [];

    var i = 0;

    console.log(`-- Parsing ${csv.slug}`);
    request({url: csv.url})
      .pipe(csvParser({separator: separator,raw: false}))
      .on('headers', (headers) => {
        insertModel(csv, headers)
          .catch(err => {
            console.error('On add registers by batch operation', err);
          });
      })
      .on('data', (record => {
        i = i + 1;

        if (config.hasOwnProperty('max_parsing_lines') && i>=config.max_parsing_lines) return false;

        if (Object.keys(record).length > 0 && record[Object.keys(record)[0]] !== undefined && !line_validator.test(record[Object.keys(record)[0]])) {
          record['base'] = csv.slug;
          values.push(record);
        }

        return record;
      }))
      .on('end', () => {
        ItemModel.remove({"base": csv.slug}).catch(err => { console.error(`On remove all from ${csv.slug}`)});
        ItemModel.insertMany(values);
        console.log(`-- End parsing ${csv.slug} (${values.length} lines imported)`);
      }); 
  };

  return Promise.map(config.base.csv, requestCSV);
}

console.log('Loading csv databases ...');
sync(config, CSVModel, ItemModel);
