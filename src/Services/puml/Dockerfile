FROM node:current-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# ENTRYPOINT [ "sh" ]
RUN apk add openjdk11
RUN apk add --no-cache graphviz ttf-droid curl

COPY . .
RUN npm install

EXPOSE 3000

CMD [ "node", "index.js" ]