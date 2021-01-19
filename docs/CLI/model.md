---
layout: default 
title: cli-model
permalink: cli-model
parent: cli
has_children: true
---

# ailtire model

Manage models in the applications. This includes the creation of models in the application.

## Synopsis

```shell
ailtire model <command> [args]

ailtire model create --name <model name> --package <Package Name>
ailtire model get --name <model name>
ailtire model list
```

## Description

Used to manage the model using the ailtire framework. 

* [ailtire model create](cli-model-create) - Create a model in the ailtire framework the package specified.
* [ailtire model get](cli-model-get) - Get the information for the model in the ailtire application.
* [ailtire model list](cli-model-list) - Get the models of the ailtire application.

## Directories

The creation of the model directory structure is one of the most important aspects of the framework. For
information on the directory structure see [directory structure](directory) for more information.

## See Also

* [ailtire model create](cli-model-create)
* [ailtire model get](cli-model-get)
* [ailtire model list](cli-model-list)
