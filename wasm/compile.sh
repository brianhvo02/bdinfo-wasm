emcc -O3 --embind-emit-tsd interface.d.ts \
    -s FORCE_FILESYSTEM \
    -l workerfs.js -l embind -l freetype \
    -I ./build/libbluray/src  -o ../public/static/js/libbluray_web.js \
    bluray.cpp build/libbluray/.libs/libbluray.a build/libxml2/.libs/libxml2.so
mv ../public/static/js/interface.d.ts ../src/types