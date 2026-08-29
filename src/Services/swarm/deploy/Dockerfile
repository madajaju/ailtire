FROM docker:29.2.0-dind-alpine3.23

WORKDIR /usr/src/app

RUN apk update && apk add --update nodejs npm

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT [ "node" ]

CMD [ "./server.js" ]
