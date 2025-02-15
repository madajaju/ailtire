FROM alpine:latest

WORKDIR /usr/src/app

RUN apk update && apk add --update nodejs npm

RUN addgroup -g 1001 ailtireGroup && \
    adduser -u 1001 -G ailtireGroup -h /home/ailtireUser -D ailtireUser

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R ailtireUser:ailtireGroup /usr/src/app

USER ailtireUser

EXPOSE 3000

ENTRYPOINT [ "node" ]

CMD [ "./server.js" ]
