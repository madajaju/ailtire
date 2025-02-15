
FROM node:current-alpine

# Create app directory
WORKDIR /usr/src/app

RUN addgroup -g 1001 ailtireGroup && \
    adduser -u 1001 -G ailtireGroup -h /home/ailtireUser -D ailtireUser

# Install app dependencies
RUN apk add openjdk11
RUN apk add --no-cache graphviz ttf-droid curl
COPY . .
RUN npm install


RUN chown -R ailtireUser:ailtireGroup /usr/src/app

USER ailtireUser

EXPOSE 8088
CMD [ "sh" ]
