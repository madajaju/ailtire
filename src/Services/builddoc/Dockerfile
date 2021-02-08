
FROM node:current-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
RUN apk add openjdk11
RUN apk add --no-cache graphviz ttf-droid ttf-droid-nonlatin curl
RUN curl -L https://sourceforge.net/projects/plantuml/files/1.2021.1/plantuml.1.2021.1.jar/download -o plantuml.jar
COPY . .
RUN npm install

EXPOSE 8088
CMD [ "sh" ]
