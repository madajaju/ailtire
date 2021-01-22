---
layout: default 
title: ailtire app install 
permalink: cli-app-install 
parent: ailtire app 
grand_parent: Command Line Interface
has_children: false
---

# ailtire app install

Install the containers for all of the microservices and stacks in application definition.

## Synopsis

```shell
# Build containers for the ailtire application
ailtire app install --name <build name>  --env <Environment name>
```

## Description

This command uses docker swarm to deploy stacks as defined in the docker-compose.yaml file for each package and application
in the deploy directory. All of the images for the application are built using the
[ailtire app build](ailtire-app-build) command. See [Deployment Strategy](deployment) for more information.

## Generated Artifacts

This command will deploy a stack in docker swarm (K8 is in the roadmap) for the application and a stack
for each package and sub package. Each package has something called a stack container image that
uses a side-car container pattern to manage the stack for each package. This gives the ability to aggregate
stacks into large stacks that can easily be managed with one command.
When stacks are deployed they follow a naming convention so multiple instances of the application
can be run on the same docker swarm cluster.
See [Deployment Strategy Page](deployment) for more information.

## See Also

* [ailtire app](cli-app)
* [ailtire app build](cli-app)
* [Deployment Strategy](deployment)
