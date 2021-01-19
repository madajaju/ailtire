###  [ [__Website__](https://madajaju.github.io/ailtire) ] [ [Get Started](https://madajaju.github.io/ailtire/gettingstarted) ] [ [Submit an Issue](https://github.com/madajaju/ailtire/issues) ]

--- 

# Overview 
![Ailtire Logo](./docs/logo.svg)

Ailtire (architect in Scottish Gaelic) is a framework that allows system architects to design systems using UML
architectural elements as code. The UML elements supported are Actors, UseCases, Scenarios, Classes, and Packages.
Ailtire is an opinionated configuration solution.

Ailtire creates a npm project by creating a directory structure that follows many of the MVC frameworks that exists
today like Ruby on Rails, or Sailjs. Ailtire focuses on system architecture and bring subsystems together. It utilizes
the MVC pattern for simulating the application, but it is not limited to just the web interface. It also includes
microservice patterns for development and deployment using containers, and communication frameworks based on websocket
and RESTful interfaces for all subsystems and their components.

## Installation

With node already installed:

```shell
# Install ailtire from the command line
npm install ailtire -g
```

This will install ailtire globally to be used for several projects.

## Your first ailtire project

```shell
# Creates a directory called myapp and populates it with ailtire directory structure.
ailtire app create --name myapp
```

Start the application you just created.

```shell
cd myapp
npm install
npm start

> myapp@0.0.1 start C:\Users\dwpulsip\work\ailtire\myapp
> node index.js

Listening on port: 8080

```

Now you should be able to access the application in your browser.

http://localhost:8080

![Ailtire Home Page](docs/ailtire.png)

For additional information on ailtire and its uses please goto
the [getting started](https://madajaju.github.io/ailtire/getting-started) documentation.

## Compatability

Ailtire uses common npm packages for most of the heavy lifting of the application development. The backend is built
using
[nodejs](http://nodejs.org), [express](http://expressjs.com), [socket.io](http://socket.io), [ejs](https://ejs.co/)
and [commander](https://www.npmjs.com/package/commander) packages. The front end
utilizes [socket.io-client](http://socket.io), [w2ui](http://w2ui.com),
and [3d-force-graph](https://www.npmjs.com/package/3d-force-graph) for visualization and web ui elements.

## Contribute

If you are interested in working on the ailtire product please contact darren@pulsipher.org.

## License
MIT License Copyright © 2021-present, Darren Pulsipher
