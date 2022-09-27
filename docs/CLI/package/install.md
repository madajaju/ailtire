---
layout: default 
title: ailtire package install 
permalink: cli-package-install 
parent: ailtire package  
grand_parent: Command Line Interface
---

# ailtire package install

Create a package in the application for a specific package in the application.

## Synopsis

```shell
ailtire package install --help 
# ailtire package install --name <package name>  --env <environment name>

# Install the containers built during the buildEngine command.
ailtire package install --name "My Package"  --env "dev"

# Install the contains buildEngine during the buildEngine command for all of the subpackages and package
ailtire package install --name "My Package"  --env "dev" -recursive
````

## Description

This command is used to start all of the containers for the micro-services for the package. If recursive is used then 
all of the sub-package containers will be started as well.

## See Also
* [ailtire package](cli-package)
