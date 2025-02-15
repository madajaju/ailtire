FROM node:current-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# ENTRYPOINT [ "sh" ]


RUN apk add openjdk11
RUN apk add --no-cache graphviz ttf-droid curl

RUN addgroup -g 1001 ailtireGroup && \
    adduser -u 1001 -G ailtireGroup -h /home/ailtireUser -D ailtireUser

COPY . .

RUN npm install

RUN chown -R ailtireUser:ailtireGroup /usr/src/app

USER ailtireUser

EXPOSE 3000

CMD [ "node", "index.js" ]