FROM alpine:latest

WORKDIR /usr/src/app

RUN apk update && apk add --update nodejs npm

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT [ "node" ]

CMD [ "./server.js" ]
