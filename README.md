# CSV API

*CSV API* is a small api that import open datas from a list of CSV file and serve them through simple GET api.

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

Rename `config.json.template` to `config.json` and edit it.

`config.json` example:
```
{
	"port": 8080,
	"database": "mongodb://localhost/csv_api",
	"max_parsing_lines": 10,
	"base": {
		"name": "156",
		"description": "Base de Dados contendo as solicitações geradas na Central 156, principal canal de comunicação entre o cidadão e a Prefeitura Municipal de Curitiba. Inclui todas as demandas direcionadas às Secretarias e Órgãos da Administração Municipal. Estes dados são oriundos do Sistema Integrado de Atendimento ao Cidadão - SIAC.",
		"csv": [
			{
				"slug":"solicitacao",
				"name":"156 - Base de Dados",
				"url":"http://multimidia.curitiba.pr.gov.br/dadosabertos/156/2016-11-01_156_-_Base_de_Dados.csv"
			}
		]
	}
}
```

### Running / Testing

`$> node index.js`

## Heroku deploy

 - `heroku create mycsvapi`
 - `heroku addons:create mongolab:sandbox`
 - `git push heroku master`

**Example:** https://csvapi.herokuapp.com/solicitacao

## Contributing

[View issues](https://github.com/CodeForCuritiba/tows/issues)

**If no issues exists for the funcionality you want to add, please add it first and assign it to you.**

Contact: 
Code For Curitiba => code4cwb ( a ) gmail.com





