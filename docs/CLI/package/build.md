---
layout: default 
title: cli-package-build 
permalink: cli-package-build 
parent: cli-package 
grand_parent: Command Line Interface
---

# ailtire package build

Build the microservice for a package as defined in the deploy directory of the package directory.

## Synopsis

```shell
ailtire package build --help 
# ailtire package build --name <package name>  --env <Environment Name> --recursive

#i Build the package and all of its micro-services 
ailtire package build --name "My Package" --env "dev"

# Build the package and all of the subpackages micro-services
ailtire package build --name "My Package" --env "dev" --recursive

# Create a package and a sub pacakge
ailtire package create --name "My Package/Child Package"
````

## Description

This command is used to build a package' micro-services based on the deploy definitions in the deploy directory 
structure. See the [directory structure](directory) for more information.


## See Also
* [ailtire package](cli-package)
