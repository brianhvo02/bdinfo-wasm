#!/bin/sh

docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk \
    emcc -O3 --embind-emit-tsd interface.d.ts \
        -s FORCE_FILESYSTEM \
        -l workerfs.js -l embind \
        -I ./wasm/build/libbluray/src  -o ./public/static/js/libbluray_web.js \
        ./wasm/bluray.cpp ./wasm/build/libbluray/.libs/libbluray.a ./wasm/build/libxml2/.libs/libxml2.so ./wasm/build/freetype/build/libfreetype.a && \
    mv ./public/static/js/interface.d.ts ./src/types