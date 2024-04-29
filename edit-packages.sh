docker run --rm -it \
  --mount type=bind,source=./package.json,target=/usr/package.json \
  --mount type=bind,source=./package-lock.json,target=/usr/package-lock.json \
  node:18-alpine "sh"