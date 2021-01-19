---
layout: default 
title: cli-package-uninstall 
permalink: cli-package-uninstall 
parent: cli-package 
grand_parent: cli
---

# ailtire package uninstall

Create a package in the application for a specific package in the application.

## Synopsis

```shell
ailtire package uninstall --help 
# ailtire package uninstall --name <package name>  --package <package name>
# uninstall all the microservices of the package
ailtire package uninstall --name "My Package" --env "dev"

```
## Description

This command uninstalls all of the micro-services for a package. It basically kills all of the running containers
for the package and its subpackages.

## See Also
* [ailtire package](cli-package)
