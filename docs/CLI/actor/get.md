---
layout: default
title: cli-actor-get
permalink: cli-actor-get
parent: cli-actor
grand_parent: cli
---

# ailtire actor get

Get the actor of the application.

## Synopsis

```shell
ailtire actor get --name <actor name> 
```

## Description

This command is used get information about the actor. Including the name, shortname, description, use cases and
scenarios of the actor.

```javascript
// <actor name>/index.js

module.exports = {
    name: 'Application Developer',
    shortname: 'appdev',
    description: 'The Application Developer work in coordination with DevOps to manage services,' +
        ' applications and workloads through the development pipeline.'
};
```

If additional documentation about the actor is needed you can create a [doc directory](documentation) and add additional
documentation there.

## See Also

* [ailtire actor](cli-actor)
