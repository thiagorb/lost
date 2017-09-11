#!/bin/bash

SCRIPTDIR=`cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd`
SCRIPTNAME=`basename "${BASH_SOURCE[0]}"`

cd "$SCRIPTDIR"

if [ -z $1 ]
then
    tsc & 
    node_modules/.bin/node-sass -w src/app.scss --output dist &
    entr cp src/index.html dist/index.html <<< src/index.html &
    entr cp src/ship.svg dist/ship.svg <<< src/ship.svg &
fi
