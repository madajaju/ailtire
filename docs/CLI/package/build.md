---
layout: default 
title: ailtire package buildEngine 
permalink: cli-package-buildEngine 
parent: ailtire package  
grand_parent: Command Line Interface
---

# ailtire package buildEngine

Build the microservice for a package as defined in the deploy directory of the package directory.

## Synopsis

```shell
ailtire package buildEngine --help 
# ailtire package buildEngine --name <package name>  --env <Environment Name> --recursive

#i Build the package and all of its micro-services 
ailtire package buildEngine --name "My Package" --env "dev"

# Build the package and all of the subpackages micro-services
ailtire package buildEngine --name "My Package" --env "dev" --recursive

# Create a package and a sub pacakge
ailtire package create --name "My Package/Child Package"
````

## Description

This command is used to buildEngine a package' micro-services based on the deploy definitions in the deploy directory 
structure. See the [directory structure](directory) for more information.


## See Also
* [ailtire package](cli-package)
