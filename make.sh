#!/bin/bash
SCRIPTPATH=$( sed -r -e "s/\\\/\//g" <<< ${BASH_SOURCE[0]} )
PROJECTDIR=$(cd "$(dirname $SCRIPTPATH)"; pwd)

cd "$PROJECTDIR/Time"

tsc --target ES5 *.ts

if [ ! -e dist ]; then mkdir dist; fi

for js in $(ls -1 *.js)
do
    yui $js > dist/$js
done

for less in $(ls -1 *.less)
do
    css=`sed -r "s/.less$/.css/" <<< "$less"`;
    lessc $less > $css
    yui $css > dist/$css
done

for html in $(ls -1 *.html)
do
    cp $html dist/$html
done

tar -czf dist.tar.gz dist
echo dist.tar.gz created. Size: `du -b dist.tar.gz | cut -f1` bytes

if [ "$1" == "--deploy" ]
then
    cd "$PROJECTDIR"
    git push origin :gh-pages
    git subtree push --prefix Time/dist origin gh-pages
fi
