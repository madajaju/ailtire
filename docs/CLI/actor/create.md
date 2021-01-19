---
layout: default
title: cli-actor-create
permalink: cli-actor-create
parent: cli-actor
grand_parent: cli
---

# ailtire actor create

Create an actor in the application actors directory.

## Synopsis

```shell
ailtire actor create --name <actor name> 
```

## Description

This command is used to create an actor for the application. The command will create a directory in the actors directory with the name of the actor.
Additionally an index.js file will be created that contains additional information about the actor. This is where architects can add additional characteristics about the actor.

```javascript
// <actor name>/index.js

module.exports = {
    name: 'Application Developer',
    shortname: 'appdev',
    description: 'The Application Developer work in coordination with DevOps to manage services,' +
        ' applications and workloads through the development pipeline.'
};
```
If additional documentation about the actor is needed you can create a [doc directory](documentation) and add additional documentation there.

## See Also

* [ailtire actor](cli-actor)
