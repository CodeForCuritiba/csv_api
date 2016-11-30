# CSV API

*CSV API* is a small api that import open datas from a list of CSV file and serve them through simple GET api.

## Why does *CSV API* do?

 1. It import a list of CSV files into a mongoDB database
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

Rename `config.json.template` to `config.json` and edit it.

`config.json` example:
```
{
	"database": "mongodb://localhost/csv_api",
	"max_parsing_lines": 100,
	"base": {
		"name": "156",
		"description": "Base de Dados contendo as solicitações geradas na Central 156, principal canal de comunicação entre o cidadão e a Prefeitura Municipal de Curitiba. Inclui todas as demandas direcionadas às Secretarias e Órgãos da Administração Municipal. Estes dados são oriundos do Sistema Integrado de Atendimento ao Cidadão - SIAC.",
		"csv": [
			{
				"slug":"156",
				"name":"156 - Base de Dados",
				"url":"http://multimidia.curitiba.pr.gov.br/dadosabertos/156/2016-11-01_156_-_Base_de_Dados.csv",
				"docs": {
					"example_find_item": "find={\"SOLICITACAO\":\"6638498\"}",
					"example_find_items": "find={\"SEXO\":\"F\"}&limit=5",
					"example_field_values": "ORGAO"
				}
			}
		]
	}
}
```

### Sync database with csv files

`$> node sync.js`

### Running / Testing

`$> node index.js` or `$> npm start`

## Heroku deploy

**Example:** https://csvapi.herokuapp.com

 - `heroku create mycsvapi`
 - `heroku addons:create mongolab:sandbox`
 - `heroku config:set BASE_JSON=http://xxxxxxxxxxxxxxxxx`
 - `heroku config:set NODE_ENV=production`
 - `heroku config:set CONFIG={}`
 - `heroku config:set CSV_PORTAL={"name":"Xxxxxxxx","url":"http://xxxxxxxxxxxxxxxxx"}`
 - `git push heroku master`
 
### Sync database
 
`$> heroku run node sync.js` 


### Using deploy script

Quick deploy can be done using `deploy-heroku.sh` script as following:

`$> sh deploy-heroku.sh <appname> <base_configfile_url>`

This will execute all the command mentioned before

*Example:*

`$> sh deploy-heroku.sh opendisqueeconomia http://opencuritiba.herokuapp.com/bases/disqueeconomia.json`

## Contributing

[View issues](https://github.com/CodeForCuritiba/tows/issues)

**If no issues exists for the funcionality you want to add, please add it first and assign it to you.**

Contact: 
Code For Curitiba => code4cwb ( a ) gmail.com





