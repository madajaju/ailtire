---
layout: default 
title: ailtire app build 
permalink: cli-app-build 
parent: ailtire app 
grand_parent: Command Line Interface
has_children: false
---

# ailtire app build

Build the containers for all of the microservices in the application definition.

## Synopsis

```shell
# Build containers for the ailtire application
ailtire app build --name <build name>  --env <Environment name>

```

## Description

This command will build all of the container images for the micro-services defined in the deploy
directory for the application and all of its packages and sub packages.
In addition to micro-service container images being built, ailtire will build [stack container images](stack) for
each package in the architecture. See [Deployment Strategy](deployment) for more information.

## Generated Artifacts

This command will create images for microservices and stacks. Each package gets a stack container image
and each microservice defined in the deploy directory for each package will get a container image.

For example take the following directory structure for the application "myapp":
```shell
./api # the solution stack of the application.
...
./api/MyPackage/deploy/mservice1 # mservice1 micro-service
./api/MyPackage/deploy/mservice2 # mservice2 micro-service
./api/MyPackage/deploy/mservice3 # mservice3 micro-service
./api/MyPackage/SubPackage/deploy/mserviceA # mserviceA micro-service
./api/MyPackage/SubPackage/deploy/mserviceB # mserviceB micro-service
./deploy # deployment strategy for the application
./deploy/mserviceZ # mserviceZ micro-service
./deploy/mserviceY # mserviceY micro-service
```
This will generate the following micro-services container images when ailtire app build is called.
* myapp-mypackage-mservice1
* myapp-mypackage-mservice2
* myapp-mypackage-mservice3
* myapp-mypackage-subpackage-mserviceA
* myapp-mypackage-subpackage-mserviceB
* myapp-mserviceZ
* myapp-mserviceY

These images are used by stack container images to launch containers based on the defintions in the stack.
Stack container images created are as follows:

* myapp
* myapp-mypackage
* myapp-mypackage-subpackage

Each stack manages the container and subpackage stack containers under it.
For example
* myapp
  * myapp-mypackage
  * myapp-mserviceZ
  * myapp-mserviceY

## See Also

* [ailtire app](cli-app)
* [Deployment Strategy](deployment)
