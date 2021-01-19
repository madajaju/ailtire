---
layout: default 
title: ailtire model create 
permalink: cli-model-create 
parent: ailtire model 
grand_parent: Command Line Interface
---

# ailtire model create

Create a model in the application for a specific package in the application.

## Synopsis

```shell
ailtire model create --help 
# ailtire model create --name <model name>  --package <package name>
ailtire model create --name "My Class" --package "First Package"
```

## Description

This command is used to create a model for a specific package in the application. The command will create a directory in
the package directory named models and then with the name of the model. From the example above the following directory
structure will be created. Additionally an index.js file will be created that contains additional information about 
the model.

```shell
# directory for the new model.
./api/FirstPackage/models/MyClass 

# description for the new model.
./api/FirstPackage/models/MyClass/index.js 
```

This is where architects can add additional characteristics about the model. like attributes, associations,
statenet, and even views of the model.

```javascript
// api/FirstPackage/models/MyClass/index.js

class MyClass {
    static definition = {
        name: 'MyClass',
        description: 'Description of the model MyClass',
        attributes: {
            ...
        },
        associations: {
            ...
        },
        statenet: {
            ...
        },
        view: {
            ...
        }
    }
}

module.exports = MyClass;
```

If additional documentation about the model is needed you can create a [doc directory](documentation) and add additional
documentation there.

For more information on the model definition see the [Class definition](class-definition) page.

## See Also
* [ailtire model](cli-model)
