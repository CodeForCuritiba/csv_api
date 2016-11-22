'use strict';

const config = require('../config.json');
const mongoose = require('mongoose');

const { ItemModel, CSVModel } = require('./../models');

function cleanupDB(collection) {
  return new Promise((resolve, reject) => {
    if (!mongoose.connection.collections[collection]) {
      return reject(new Error(`Collection ${collection} doesn't exists`));
    }

    mongoose.connection.collections[collection].drop(err => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

function mockupDB() {
  const csv = new CSVModel({
    slug: '156',
    name: 'FOOBAR',
    url: 'example@example.foo.bar.code',
    fields: [
      {name: 'SOLICITACAO'},
      {name: 'TIPO'},
      {name: 'ORGAO'},
      {name: 'DATA'},
      {name: 'HORARIO'},
      {name: 'ASSUNTO'},
      {name: 'SUBDIVISAO'},
      {name: 'DESCRICAO'},
      {name: 'LOGRADOURO_ASS'},
      {name: 'BAIRRO_ASS'},
      {name: 'REGIONAL_ASS'},
      {name: 'MEIO_RESPOSTA'},
      {name: 'OBSERVACAO'},
      {name: 'SEXO'},
      {name: 'BAIRRO_CIDADAO'},
      {name: 'REGIONAL_CIDADAO'},
      {name: 'DATA_NASC'},
      {name: 'TIPO_CIDADAO'},
      {name: 'ORGAO_RESP'},
      {name: 'RESPOSTA_FINAL'}
    ]
  });

  const promise = ItemModel.insertMany([
    {
      SOLICITACAO: "12345",
      SEXO: "F",
      base: 156,
    },
    {
      SOLICITACAO: "123456",
      SEXO: "F",
      base: 156,
    },
    {
      SOLICITACAO: "1234578",
      SEXO: "M",
      base: 156,
    },
  ]);
  
  return promise.then(() => csv.save());
}

module.exports = {
  mockupDB,
  cleanupDB
};
