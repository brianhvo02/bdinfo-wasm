#!/bin/sh

set -e

rm -rf build
mkdir build
cd build

git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
. ./emsdk_env.sh
cd ..

git clone https://gitlab.freedesktop.org/freetype/freetype.git
cd freetype
mkdir build
cd build
emcmake cmake ..
emmake make
emmake make install
cd ../..

git clone https://github.com/libexpat/libexpat.git
cd libexpat/expat
mkdir build
cd build
emcmake cmake ..
emmake make
emmake make install
cd ../../..

git clone https://gitlab.freedesktop.org/fontconfig/fontconfig.git
cd fontconfig
emconfigure ./autogen.sh
emmake make
cd ..

git clone https://gitlab.gnome.org/GNOME/libxml2.git
cd libxml2
emconfigure ./autogen.sh --with-http=no --with-ftp=no --with-python=no --with-threads=no
emmake make
cd ..

git clone https://code.videolan.org/videolan/libbluray.git
cd libbluray
git submodule update --init
./bootstrap
FONTCONFIG_LIBS=../fontconfig FONTCONFIG_CFLAGS=-I../fontconfig \
LIBXML2_LIBS=../libxml2 LIBXML2_CFLAGS=-I../libxml2/include \
emconfigure ./configure --enable-examples=no
emmake make
cd ..

python3 -m venv venv
. ./venv/bin/activate

pip install wheel

git clone https://gitlab.com/drj11/pypng.git
pip wheel ./pypng
pip install ./pypng

git clone https://github.com/SAPikachu/igstools.git
pip wheel --find-links=. ./igstools

cp *.whl ../../public/static/py
deactivate