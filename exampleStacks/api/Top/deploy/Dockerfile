FROM docker:latest
RUN mkdir /cnab

RUN apk update && apk add dos2unix

COPY . /cnab

RUN dos2unix /cnab/run && apk del dos2unix

RUN chmod 777 /cnab/run

WORKDIR "cnab"

CMD "./run"
