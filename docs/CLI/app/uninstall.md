---
layout: default 
title: ailtire app uninstall 
permalink: cli-app-uninstall 
parent: ailtire app 
grand_parent: Command Line Interface
has_children: false
---

# ailtire app uninstall

Uninstall the containers for all of the microservices and stacks in application definition.

## Synopsis

```shell
# Build containers for the ailtire application
ailtire app uninstall --name <buildEngine name>  --env <Environment name>
```

## Description

This command uses docker swarm to kill all of the stacks as defined in the docker-compose.yaml file for each package
and application in the deploy directory. All of the stacks, containers, and networks will be distroyed.
This basically kills all of the microservices and cleans up all of the network and source
targets in the stack definition.

## See Also

* [ailtire app](cli-app)
* [ailtire app install](cli-app-install)
* [Deployment Strategy](deployment)
