FROM node:18-alpine

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
COPY package*.json ./

# Install node packages to build node_modules for consumption by dependent images.
RUN npm install \
    && npm install -g serve