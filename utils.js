'use strict'

const fs = require('fs');
const request = require('request');
const csvParser = require('csv-parser');
const _ = require('lodash');

/*******************************************************************************
  function     : readFile
  paramters    : file:string
  return       : string
  description  : Sync reads a plain text file.
*******************************************************************************/
function readFile(file) {
  return fs.readFileSync(file,"utf8");
}

function sync(config, CSVModel, ItemModel) {
  const insertModel = (csv, headers) => {
    const find = { 'slug' : csv.slug };
    const opt = { 'new': true, 'upsert': true }
    
    csv.fields = _.map(_.split(headers, ';'), (header) => {
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

    request({url: csv.url})
      .pipe(csvParser())
      .on('headers', (headers) => {
        insertModel(csv, headers)
          .catch(err => {
            console.error('On add registers by batch operation', err);
          });
      })
      .on('data', (record => {
        values.push(record);
        return record;
      }))
      .on('end', () => {
        ItemModel.insertMany(values);
      }); 
  };

  return Promise.map(config.base.csv, requestCSV);
}

module.exports = {
  readFile,
  sync
};
