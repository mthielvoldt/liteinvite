FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV local

# COPY package*.json ./ # don't need this - using bind mounts next line

# Install node packages as a separate step so docker's caching will 
# accelerate subsequent builds.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

COPY . .

RUN chown -R node /app
USER node

EXPOSE 3000
CMD npm run dev