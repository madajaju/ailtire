---
layout: default
title: ailtire package
permalink: cli-package
parent: Command Line Interface
has_children: true
---

# ailtire package

Manage packages in an ailtire application. This includes the creation of packages and the building of package
micro-services using the container ecosystem.

## Synopsis

```shell
ailtire package <command> [args]

ailtire package buildEngine --env <environment name> --name <name of the buildEngine>
ailtire package create --name <package name>
ailtire package docs
ailtire package install --env <environment name> --name <name of the installation>
ailtire package status --env <environment name> --name <name of the installation>
ailtire package uninstall --env <environment name> --name <name of the installation>
```

## Description

Used to manage the packages in the ailtire application using the ailtire framework. Once a package is created it
can be built using the [ailtire package buildEngine](cli-package-buildEngine) command. This command will create containers
that can e used to deploy the application using the [ailtire package install](cli-package-install) command.

* [ailtire package buildEngine](cli-package-buildEngine) - Build the container images for the package based on the deployment
  architecture in the [directory structure](directory).
* [ailtire package create](cli-package-create) - Create an package in the ailtire framework. Create
  the [directory structure](directory) for the package.
* [ailtire package install](cli-package-docs) - install the package using the container ecosystem. This will deploy all
  containers, networks, and storage based on the deployment architecture.
* [ailtire package status](cli-package-status) - check the status of a installed package.
* [ailtire package uninstall](cli-package-uninstall) - uninstall the package using the container ecosystem. This will kill
  any running containers.

## Directories

The creation of the package directory structure is one of the most important aspects of the framework. For
information on the directory structure see [directory structure](directory) for more information.

## See Also

* [ailtire package buildEngine](cli-package-buildEngine)
* [ailtire package create](cli-package-create)
* [ailtire package get](cli-package-get)
* [ailtire package install](cli-package-install)
* [ailtire package list](cli-package-list)
* [ailtire package status](cli-package-status)
* [ailtire package uninstall](cli-package-uninstall)
