'use strict'

const mongoose = require('mongoose');

// Use bluebird promises
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const csvSchema = new Schema({
  slug: String,
  name: String,
  url: String,
  fields: [{
    name: String
  }]
}, { strict: false });

module.exports = mongoose.model('csv', csvSchema);