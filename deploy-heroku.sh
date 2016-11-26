#!/bin/bash

# deploy_heroku - A script to deploy app to free heroku cloud server
# Usage: $> sh deploy-heroku.sh <appname> <base_configfile_url>  [<portalname> <portalurl>]
# Exemple: $> sh deploy-heroku.sh opendisqueeconomia http://opencuritiba.herokuapp.com/bases/disqueeconomia.json "Open Curitiba CSV Webservices" http://opencuritiba.herokuapp.com

##### Constants

TITLE="Deploy to Heroku: $1"
RIGHT_NOW=$(date +"%x %r %Z")
TIME_STAMP="Updated on $RIGHT_NOW by $USER"

##### Main
echo "$TITLE"
echo "$TIME_STAMP"

if [ $# >= 3 ]; then
	heroku create $1

	git remote add $1 https://git.heroku.com/$1.git

	heroku addons:create mongolab:sandbox --app $1

	heroku config:set BASE_JSON=$2 --app $1

	heroku config:set NODE_ENV=production --app $1

	if [ $# >= 5 ]; then

		heroku config:set CONFIG="{\"csv_portal\":{\"name\":\"$3\",\"url\":\"$4\"}}" --app $1

	else

		heroku config:set CONFIG={} --app $1

	fi

	git push $1 master

	heroku run node sync.js --app $1

	echo  "Finished"
else
    echo "Wrong number of arguments: call should be like 'sh deploy-heroku.sh <appname> <base_configfile_url> [<portalname> <portalurl>]'"
fi




