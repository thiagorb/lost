rm -rf package
mkdir package
./node_modules/.bin/browserify src/app.ts -p [ tsify ] | node_modules/.bin/uglifyjs > package/app.js
./node_modules/.bin/svgo src/ship.svg package/ship.svg
./node_modules/.bin/node-sass src/app.scss --output package
cp src/index.html package/index.html
tar -czf package.tar.gz package/*
du -sh package.tar.gz