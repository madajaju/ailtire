---
layout: default 
title: ailtire usecase create 
permalink: cli-usecase-create 
parent: ailtire usecase 
grand_parent: Command Line Interface
---

# ailtire usecase create

Create a usecase in the application for a specific package in the application.

## Synopsis

```shell
ailtire usecase create --help 
# ailtire usecase create --name <usecase name>  --package <package name>
ailtire usecase create --name "My Use Case" --package "First Package"
```

## Description

This command is used to create an use case for a specific package in the application. The command will create a directory in
the package directory named usecases and then with the name of the use case. From the example above the following directory
structure will be created. Additionally an index.js file will be created that contains additional information about 
the model.

```shell
# directory for the new model.
./api/FirstPackage/usecases/MyUseCase 

# description for the new model.
./api/FirstPackage/usecases/MyUseCase/index.js 
```

This is where architects can add additional characteristics about the model. like attributes, associations,
statenet, and even views of the model.

```javascript
// api/FirstPackage/usecsaes/MyUseCase/index.js
module.exports = {
    name: 'My Use Case',
    description: 'Description for a Use Case',
    method: 'mypackage/method',
    actors: {
        'My Actor': 'uses'
    },
};
```

If additional documentation about the usecase is needed you can create a [doc directory](documentation) and add additional
documentation there. Scenarios can be added to the use case by using the [scenario create](scenario-create) command.

For more information on the model definition see the [Use Case definition](usecase-definition) page.

## See Also
* [ailtire usecase](cli-usecase)
