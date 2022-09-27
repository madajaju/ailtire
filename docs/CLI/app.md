---
layout: default 
title: ailtire app
permalink: cli-app
parent: Command Line Interface
has_children: true
---

# ailtire app

Manage ailtire applications. this includes the creation of an application, generating documentation, building,
installing, uninstalling and check the status of the application.

## Synopsis

```shell
ailtire app <command> [args]

ailtire app buildEngine --env <environment name> --name <name of the buildEngine>
ailtire app create --name <app name> --path <file path>
ailtire app docs
ailtire app install --env <environment name> --name <name of the installation>
ailtire app status --env <environment name> --name <name of the installation>
ailtire app uninstall --env <environment name> --name <name of the installation>
```

## Description

Used to manage the application using the ailtire framework. Once an application is created it can be built using the
[ailtire app buildEngine](cli-app-buildEngine) command. This command will create containers that can e used to deploy the
application using the
[ailtire-app-install](cli-app-install) command.

* [ailtire app buildEngine](cli-app-buildEngine) - Build the container images for the application based on the deployment
  architecture in the [directory structure](directory).
* [ailtire app create](cli-app-create) - Create an application in the ailtire framework. Create
  the [directory structure](directory) for the application.
* [ailtire app docs](cli-app-docs) - Create the documentation for the application to make them github pages ready for
  publishing.
* [ailtire app install](cli-app-docs) - install the application using the container ecosystem. This will deploy all
  containers, networks, and storage based on the deployment architecture.
* [ailtire app status](cli-app-status) - check the status of a installed application.
* [ailtire app uninstall](cli-app-uninstall) - uninstall the application using the container ecosystem. This will kill
  any running containers.

## Directories

The creation of the application directory structure is one of the most important aspects of the framework. For
information on the directory structure see [directory structure](directory) for more information.

## See Also

* [ailtire app buildEngine](cli-app-buildEngine)
* [ailtire app create](cli-app-create)
* [ailtire app docs](cli-app-docs)
* [ailtire app install](cli-app-docs)
* [ailtire app status](cli-app-status)
* [ailtire app uninstall](cli-app-uninstall)
