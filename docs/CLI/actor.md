---
layout: default
title: ailtire actor
permalink: cli-actor
parent: Command Line Interface
has_children: true
---

# ailtire actor

Manage actors in the application. This includes the creation of actors in the application.

## Synopsis

```shell
ailtire actor <command> [args]

ailtire actor create --name <actor name>
ailtire actor list
ailtire actor get --name <actor name>
```

## Description

Used to manage the actors of the aitire pplication. For each actor created a directory with the name of the actor is
created in the actors directory. All information about the actor is contained in this directory. Included in this
directory is an index.js file and a [doc directory](documentation) that can contain additional information about the
actor.

* [ailtire actor create](cli-actor-create) command. This command will create the actor in the actors directory.
* [ailtire actor get](cli-actor-get) command.  This gets the information about an actor.
* [ailtire actor list](cli-actor-list) command.  This gets a list of all of the actors of the system.

## Directories

The creation of the actor directory in the actors directory in the application base directory.

## See Also

* [ailtire actor create](cli-actor-create)
* [ailtire actor get](cli-actor-get)
* [ailtire actor list](cli-actor-list)
