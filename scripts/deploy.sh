#!/usr/bin/env bash
git clone git@github.com:kerzner/cell-sketches.git dist
cd dist
git checkout -b gh-pages
git branch --set-upstream-to=origin/gh-pages gh-pages
git pull
bower install
git add *
git add -f bower_components
git commit -m "Deploy"
git push
cd ../
rm -rf dist
