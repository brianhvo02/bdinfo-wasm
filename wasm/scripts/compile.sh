#!/bin/sh

set -e

cd ./build/emsdk
. ./emsdk_env.sh
cd ../..

mkdir -p ../public/static/js
emcc -O3 --embind-emit-tsd interface.d.ts \
    -s FORCE_FILESYSTEM \
    -l workerfs.js -l embind \
    -I ./build/libbluray/src  -o ../public/static/js/libbluray_web.js \
    bluray.cpp ./build/libbluray/.libs/libbluray.a ./build/libxml2/.libs/libxml2.so ./build/freetype/build/libfreetype.a
mv ../public/static/js/interface.d.ts ../src/types