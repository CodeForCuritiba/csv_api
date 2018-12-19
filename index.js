'use strict'

const bluebird = require('bluebird');
global.Promise = bluebird;

const env = process.env.NODE_ENV || 'development';
const config = (process.env.CONFIG) ? JSON.parse(process.env.CONFIG) : require('./config.json');
const joi = require('joi');
const express = require('express');
const mongoose = require('mongoose');
mongoose.connect(env === 'test' ? config.test_database : (process.env.MONGODB_URI || config.database));

const { ItemModel, CSVModel } = require('./models');

const app = express();
module.exports = app;

app.set('view engine', 'ejs');

const request = require('request');
const base_json = process.env.BASE_JSON || config.base_json;
if ( base_json ) {
  try {

    request(base_json, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        config.base = JSON.parse(body);
      } else {
        console.log(error,response);
      }
    });

  } catch (err) {
    console.log(err);
  }
}

app.get('/', (req, res) => {
  res.render('pages/index', {
    base: config.base,
    csv_portal: config.csv_portal,
    domain: `${req.protocol}://${req.get('host')}`
  });
});

const baseSchemaValidator = (base) => {
  const baseSchema = joi.object().keys({
    name: joi.string().required(),
    description: joi.string().required(),
    csv: joi.array().items({
      slug: joi.string().required(),
      name: joi.string().required(),
      url: joi.string().required(),
      docs: joi.object().keys({
        example_find_item: joi.string().optional(),
        example_find_items: joi.string().optional(),
        example_field_values: joi.string().optional()
      })
    })
  });

  const validate = Promise.promisify(joi.validate);
  return validate(base, baseSchema);
}

const validateBases = (bases) => {
  return (validator) => {
    return Promise.map(bases, base => {
      return validator(base);
    }).then(_result => true);
  }
};

app.get('/:slug', (req, res) => {
  res.json(config.base);
});

app.get('/:slug/item', (req, res) => {
  const find = (req.query.find) ? JSON.parse(req.query.find) : {};
  find['base'] = req.params.slug;

  ItemModel.findOne(find)
    .then(result => {
      if (!result) return res.json({});
      res.json(result);
    })
    .catch(err => {
      console.error(`Error on ${req.path}, err: ${err}`);
      res.status(500).end();
    });
});

app.get('/:slug/items', (req, res) => {
  const find = (req.query.find) ? JSON.parse(req.query.find) : {};
  find['base'] = req.params.slug;
  
  const options = { 'limit': 30 };
  if (req.query.limit) options['limit'] = 1 * req.query.limit;  
  if (req.query.sort) options['sort'] = JSON.parse(req.query.sort);  
  if (req.query.skip)  options['skip']  = parseFloat(req.query.skip);

  ItemModel.find(find, {}, options) 
    .then(results => {
      if (!results.length) return res.json([]);
      res.json(results);
    })
    .catch(err => {
      console.error(`Error on ${req.path}, err: ${err}`);
      res.status(500).end();
    });
});

app.get('/:slug/fields', (req, res) => {
  const find = {};
  find['slug'] = req.params.slug;

  CSVModel.findOne(find)
    .then(result => res.json(result.fields))
    .catch(err => {
      console.error(`Error on ${req.path}, err: ${err}`);
      res.status(500).end();
    });
});

app.get('/:slug/:field', (req, res) => {
  ItemModel.aggregate([
    { '$group': { '_id': '$' + req.params.field } },
    { '$limit': 200 }
  ], function (err, results) {
    if (err) {
      res.json(false);
    } else {
      const values = [];
      for (let i = results.length - 1; i >= 0; i--) {
        values.push(results[i]['_id']);
      };
      res.json(values);
    }
  });
});

app.get('/:slug/widget', (req, res) => {
  ItemModel.aggregate([
    { '$group': { '_id': '$' + req.params.field } },
    { '$limit': 200 }
  ], function (err, results) {
    if (err) {
      res.json(false);
    } else {
      const values = [];
      for (let i = results.length - 1; i >= 0; i--) {
        values.push(results[i]['_id']);
      };
      res.json(values);
    }
  });
});


validateBases([config.base])(baseSchemaValidator)
  .then(() => {
    if (env !== 'test') {
      const port = process.env.PORT || config.port || 8080; // set our port
      app.listen(port, err => {
        if (err) return console.error(`Ops ${err}`);
        console.log('Magic happens on port ' + port);
      });
    } else {
      console.log('test mode');
    }
  }).catch(err => {
    console.error(err.toString());
  });
