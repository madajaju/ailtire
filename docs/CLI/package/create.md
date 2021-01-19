---
layout: default 
title: cli-package-create 
permalink: cli-package-create 
parent: cli-package 
grand_parent: cli
---

# ailtire package create

Create a package in the application for a specific package in the application.

## Synopsis

```shell
ailtire package create --help 
# ailtire package create --name <package name>  --package <package name>
# Create a package named My Package
ailtire package create --name "My Package" 

# Create a package and a sub pacakge
ailtire package create --name "My Package/Child Package"

## Description

This command is used to create a package for a specific package in the application. The command will create a directory in
the package directory named package and then with the name of the package. From the example above the following directory
structure will be created. Additionally an index.js file will be created that contains additional information about 
the package.

```shell
# directory for the new package.
./api/MyPackage

# description for the new model.
./api/MyPackage/index.js 

# direcotyr for the new sub package.
./api/MyPackage/ChildPackage

# description for the new model.
./api/MyPackage/ChildPackage/index.js 

```
The package definition is contained in its directory structure as well as an index.js file.

```javascript
// api/FirstPackage/models/MyClass/index.js

module.exports = {
    shortname: 'mp',
    name: 'My Package',
    description: 'My Package description',
    color: 'lightblue'
};
```

Each package that is created in ailtire has a directory structure that holds all of the information about the package.
For more information on the direcotry sturcture of the package see [package directory](package) for more information.
If additional documentation about the actor is needed you can create a [doc directory](documentation) and add additional
documentation there.

For more information on the model definition see the [Class definition](class-definition) page.

## See Also
* [ailtire package](cli-package)
