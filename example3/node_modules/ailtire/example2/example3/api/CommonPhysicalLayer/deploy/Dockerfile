FROM node:alpine

WORKDIR /usr/src/app
RUN npm install
COPY whilePing.sh .
CMD [ "node", "server.js" ]
