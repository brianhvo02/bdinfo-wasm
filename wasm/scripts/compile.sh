#!/bin/sh

set -e

cd ./build/emsdk
. ./emsdk_env.sh
cd ../..

mkdir -p ../public/static/js
emcc -O3 --embind-emit-tsd interface.d.ts \
    # -s ALLOW_MEMORY_GROWTH -s MODULARIZE -s 'EXPORTED_RUNTIME_METHODS=["FS"]' \
    -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM \
    -l workerfs.js -l embind -l openal \
    -I ./build/libbluray/src -I ./build/libsndfile/include -o ../public/static/js/libbluray_web.js \
    bluray.cpp ts.cpp \
    ./build/libbluray/.libs/libbluray.a ./build/libxml2/.libs/libxml2.a ./build/freetype/build/libfreetype.a ./build/libsndfile/src/.libs/libsndfile.so
mv ../public/static/js/interface.d.ts ../src/types