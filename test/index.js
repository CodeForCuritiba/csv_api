'use strict'

global.Promise = require('bluebird');
const supertest = require('supertest');
const app = require('../index');
const { expect } = require('chai');
const { mockupDB, cleanupDB } = require('./support');

const handleCleanupDB = () => {
  return Promise.all([
    cleanupDB('csvs'),
    cleanupDB('items')]);
}

describe('CSV base', () => {
  beforeEach(() => {
    return mockupDB();
  });

  afterEach(() => {
    return handleCleanupDB();
  });

  it('should request the base description (200)', () => {
    return supertest(app)
      .get('/156')
      .expect(200)
      .then(result => {
        expect(result.body.name).to.be.equal('156');
      });
  });

  describe('command find', () => {
    it('should find nothing (200)', () => {
      return supertest(app)
        .get('/156/item?find={"SOLICITACAO": "54321"}')
        .expect(200)
        .then(result => {
          expect(Object.keys(result.body)).to.have.length(0);
        });
    });

    it('should find by group (200)', () => {
      return supertest(app)
        .get('/156/items/groupby/SEXO')
        .expect(200)
        .then(result => {
          expect(result.body).to.have.members(['F', 'M']);  
        });
    });

    it('should find one register (200)', () => {
      return supertest(app)
        .get('/156/item?find={"SOLICITACAO": "12345"}')
        .expect(200)
        .then(result => {
          expect(result.body).to.have.any.key('SOLICITACAO', 'SOLICITACAO');
        });
    });

    it('should find multiple registers (200)', () => {
      return supertest(app)
        .get('/156/items?find={"SEXO": "F"}')
        .expect(200)
        .then(result => {
          expect(result.body).to.have.length(2);
        });
    });
  });

  describe('fields', () => {
    it('should get all header fileds', () => {
      return supertest(app)
        .get('/156/fields')
        .expect(200)
        .then(result => {
          expect(result.body).to.have.length(20);
        });
    });
  });
});
