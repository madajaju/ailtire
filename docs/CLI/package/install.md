---
layout: default 
title: cli-package-install 
permalink: cli-package-install 
parent: cli-package 
grand_parent: cli
---

# ailtire package install

Create a package in the application for a specific package in the application.

## Synopsis

```shell
ailtire package install --help 
# ailtire package install --name <package name>  --env <environment name>

# Install the containers built during the build command.
ailtire package install --name "My Package"  --env "dev"

# Install the contains build during the build command for all of the subpackages and package
ailtire package install --name "My Package"  --env "dev" -recursive
````

## Description

This command is used to start all of the containers for the micro-services for the package. If recursive is used then 
all of the sub-package containers will be started as well.

## See Also
* [ailtire package](cli-package)
