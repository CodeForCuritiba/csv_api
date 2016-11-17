# tows

*TO WebService* is a small api that import open datas from a CSV file and serve them as simple GET api.

## What it should do

 1. Sync CSV File into mongoDB database
 2. Serve datas from GET requests
 3. Cloud hosting (Heroku?)
 4. Automatic documentation
 
## Routes

 - `/` : web service automatic documentation
 - `/:base_slug` : return json with base description
 - `/:base_slug/item` : return one row from the csv as json. Using query parameter: `find`
 - `/:base_slug/items` : return a list of rows from the csv as json. Using query parameters: `find`, `order`, `limit`
 - `/:base_slug/fields` : return the csv column names
 - `/:base_slug/:fieldname`: return all unique value from a column

## First steps

### Pre-requisitos

NodeJs, MongoDB and NPM installed

Node global modules: Express, Mongoose

### Installation

`$> git pull ....`

`$> npm install`

### Configuration

Edit config file

### Running / Testing

`$> node index.js`

## Contributing

[View issues](https://github.com/CodeForCuritiba/tows/issues)

**If no issues exists for the funcionality you want to add, please add it first and assign it to you.**

Contact: 
Code For Curitiba => code4cwb ( a ) gmail.com





