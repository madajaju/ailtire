---
layout: default 
title: ailtire app docs 
permalink: cli-app-docs 
parent: ailtire app 
grand_parent: Command Line Interface
has_children: false
---

# ailtire app docs

Build the documentation for the application.

## Synopsis

```shell
# Build containers for the ailtire application
ailtire app docs

```

## Description

This command will buildEngine the docs directory from the architecture defined in the directory structure
and in the doc directory for each architectural element.

## Generated Artifacts

This command will generate the docs directory and all of the corresponding documentation.

The following is the top levels directory structure created by this command.

```shell
./docs
./docs/index.md
./docs/actors
./docs/mypackage
./docs/mypackage/index.md
./docs/mypackage/subpackage
./docs/mypackage/subpackage/index.md
```

Several other files are created to show UML diagrams using plantuml, *.md files for github
markdown language for github pages.

See [documentation](documentation) for more information.


## See Also

* [ailtire app](cli-app)
* [Documentation](documentation)
