FROM mthielvoldt/liteinvite-base:latest

ENV NODE_ENV local

RUN npm install

EXPOSE 3000

# CMD [ "serve", "-s", "build" ]
# CMD [ "node", "server.js" ]