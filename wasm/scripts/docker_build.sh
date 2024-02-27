#!/bin/sh

docker run -it --rm -v $(pwd):/app -w /app/wasm debian sh -c "./install_reqs.sh && ./build.sh && ./compile.sh"