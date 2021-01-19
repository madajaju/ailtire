---
layout: default
title: cli
permalink: cli
has_children: true
---
# ailtire

Manage ailtire applications. this includes the creation of an application, generating documentation, building,
installing, uninstalling and check the status of the application.

## Synopsis

```shell
ailtire <command> [args]

ailtire action <command> [args]
ailtire actor <command> [args]
ailtire app <command> [args]
ailtire model <command> [args]
ailtire package <command> [args]
ailtire scenario <command> [args]
ailtire usecase <command> [args]
```

## Description

The ailtire framework is used to create applications and architecture elements in the framework. This includes
the creation of Packages, Use Cases, Actors, Scenarios, Models, and Actions in the architecture.

* [ailtire app](cli-app) - Manage the creation, installation, and documentation of an application.
* [ailtire action](cli-action) - Manage actions in the architecture. Actions are used to perform scenarios in the application. 
* [ailtire actor](cli-actor) - Manage actors in the architecture. Actors are tied to Use Cases and use the system through te use cases.
* [ailtire model](cli-model) - Manage models in the architecture. Models represent the data model elements in the architecture.
* [ailtire package](cli-package) - Manage packages in the architecture. Packages represent subsystems and their micro-services in the architecture.
* [ailtire scenario](cli-scenario) - Manage scenarios in the architecture. Scenarios are instances of usecases of the application and subsystems.
* [ailtire usecase](cli-usecase) - Manage use cases in the architecture. Use Cases are how actors interace with the application or subsystems.

## Directories

The creation of the application directory structure is one of the most important aspects of the framework. For
information on the directory structure see [directory structure](directory) for more information.

## See Also

* [ailtire app](cli-app)
* [ailtire action](cli-action)
* [ailtire actor](cli-actor)
* [ailtire model](cli-model)
* [ailtire package](cli-package)
* [ailtire scenario](cli-scenario)
* [ailtire usecase](cli-usecase)
