#!/bin/sh

mkdir build
cd build

embuilder build freetype

git clone https://gitlab.gnome.org/GNOME/libxml2.git
cd libxml2
emconfigure ./autogen.sh --with-http=no --with-ftp=no --with-python=no --with-threads=no --with-sax1
emmake make
cd ..

git clone https://code.videolan.org/videolan/libbluray.git
cd libbluray
git submodule update --init
./bootstrap
LIBXML2_LIBS=../libxml2/ LIBXML2_CFLAGS=-I../libxml2/include emconfigure ./configure --enable-examples=no --without-fontconfig
emmake make
cd ..

git clone https://gitlab.com/drj11/pypng.git
cd pypng
pip wheel .
cd ..

git clone https://github.com/SAPikachu/igstools.git
cd igstools
pip wheel --find-links=../pypng .
cd ../..

cp ./build/igstools/igstools-*.whl ../public/static/py/igstools.whl
cp ./build/pypng/pypng-*.whl ../public/static/py/pypng.whl

mkdir -p ../public/static/js