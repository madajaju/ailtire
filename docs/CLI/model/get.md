---
layout: default
title: cli-model-get
permalink: cli-model-get
parent: cli-model
grand_parent: cli
---

# ailtire model get

Get the model of the application.

## Synopsis

```shell
ailtire model get --name <model name> 
```

## Description

This command is used get information about the model. Including the name, attributes, associations, and statenet.

```javascript
// <model name>/index.js

module.exports = {
    name: 'Application Developer',
    shortname: 'appdev',
    description: 'The Application Developer work in coordination with DevOps to manage services,' +
        ' applications and workloads through the development pipeline.'
};
```

If additional documentation about the model is needed you can create a [doc directory](documentation) and add additional
documentation there.

## See Also

* [ailtire model](cli-model)
