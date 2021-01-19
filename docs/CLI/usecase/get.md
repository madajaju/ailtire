---
layout: default
title: ailtire usecase get
permalink: cli-usecase-get
parent: ailtire usecase
grand_parent: Command Line Interface
---

# ailtire usecase get

Get the usecase of the application.

## Synopsis

```shell
ailtire usecase get --name <usecase name> 
```

## Description

This command is used get information about the use case. Including the name, attributes, associations, and statenet.

```javascript
// <use case name>/index.js
module.exports = {
    name: 'My Use Case',
    description: 'Description for a Use Case',
    method: 'mypackage/method',
    actors: {
        'My Actor': 'uses'
    },
};
```

If additional documentation about the use case is needed you can create a [doc directory](documentation) and add additional
documentation there.

## See Also

* [ailtire usecase](cli-model)
