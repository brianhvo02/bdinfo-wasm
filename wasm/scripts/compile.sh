#!/bin/sh

set -e

cd ./build/emsdk
. ./emsdk_env.sh
cd ../..

mkdir -p ../public/static/js
emcc -O3 --embind-emit-tsd interface.d.ts -l workerfs.js -l embind -I ./build/libbluray/src -o ./build/libbluray.js \
    -s ALLOW_MEMORY_GROWTH -s MAXIMUM_MEMORY=4gb -s MODULARIZE -s FORCE_FILESYSTEM -s 'EXPORTED_RUNTIME_METHODS=["FS"]' -s ENVIRONMENT='worker' \
    bluray.cpp ./build/libbluray/.libs/libbluray.a ./build/libxml2/.libs/libxml2.a ./build/freetype/build/libfreetype.a
mv ./build/interface.d.ts ../src/types
mv ./build/libbluray.js ../src
mv ./build/libbluray.wasm ../public/static/js