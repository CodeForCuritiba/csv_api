'use strict'

const mongoose = require('mongoose');

// Use bluebird promises
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
  base: String
}, { strict: false });

module.exports = mongoose.model('item', itemSchema);
