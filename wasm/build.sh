#!/bin/sh

mkdir build
cd build

git clone https://code.videolan.org/videolan/libbluray.git
cd libbluray
git submodule update --init
./bootstrap
embuilder build freetype
emconfigure ./configure --enable-examples=no --without-fontconfig --without-libxml2
emmake make

cd ..
git clone https://github.com/SAPikachu/igstools.git
cd igstools
git clone https://gitlab.com/drj11/pypng.git
cd pypng
pip wheel .
cd ..
pip wheel --find-links=./pypng .

cp ./build/igstools/igstools-*.whl ../public/static/py/igstools.whl
cp ./build/igstools/pypng-*.whl ../public/static/py/pypng.whl

mkdir -p ../public/static/js