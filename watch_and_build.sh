#!/bin/bash

SCRIPTDIR=`cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd`
SCRIPTNAME=`basename "${BASH_SOURCE[0]}"`

cd "$SCRIPTDIR"

./node_modules/.bin/watchify src/app.ts -p [ tsify ] -o dist/app.js & 
watchify_pid=$!

./node_modules/.bin/node-sass -w src/app.scss --output dist &
sass_pid=$!

entr cp src/index.html dist/index.html <<< src/index.html &
html_pid=$!

entr cp src/ship.svg dist/ship.svg <<< src/ship.svg &
svg_pid=$!

read
kill $watchify_pid
kill $sass_pid
kill $html_pid
kill $svg_pid