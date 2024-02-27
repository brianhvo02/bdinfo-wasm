#!/bin/sh

docker run -dt --name bdinfo-build -v $(pwd):/app -w /app/wasm debian 
docker exec -it bdinfo-build ./scripts/install_reqs.sh
docker exec -it -u $(id -u):$(id -g) bdinfo-build ./scripts/build.sh
docker exec -it -u $(id -u):$(id -g) bdinfo-build ./scripts/compile.sh
docker rm --force bdinfo-build