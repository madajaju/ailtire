---
layout: default 
title: ailtire scenario create 
permalink: cli-scenario-create 
parent: ailtire scenario 
grand_parent: Command Line Interface
---

# ailtire scenario create

Create a scenario for a use case in the application for a specific package in the application.

## Synopsis

```shell
ailtire scenario create --help 
# ailtire scenario create --name <scenario name>  --package <scenario name>
# Create a scenario named My Package
ailtire scenario create --name "My Scenario Name" --usecase "My Use Case" --package "My Package"
```

This will create a scenario named "My Scenario Name" for the use case "My Use Case" for the package "My Package".

## Description

This command is used to create a scenario for a specific use case in a specific package in the application. 
The command will create a scenario file (<scenarioName>.js) in the package/usecases/<UsecaseName> directory.
From the example above the following directory structure will be created. 

```shell
# directory for the Use Case "MyUseCase"
./api/MyPackage/usecases/MyUseCase

# file for the Scenario in the Use Case.
./api/MyPackage/usecases/MyUseCase/MyScenarioName.js

```
The scenario definition is contained in the <scenario name>.js file following the format below.

```javascript
// api/FirstPackage/usecases/MyUseCase/MyScenarioName.js
module.exports = {
    name: 'My Scenario Name',
    description: 'Scenario description',
    method: 'mypackage/method', // This is a primary interface call for the scenario. 
    actors: {
        'My Actor': 'uses',
    },
    steps: [
        {action: 'mypackage/method', parameters: {name: 'host1', file: './templates/device.yaml'}},
        ...
        {action: 'mypackage/method', parameters: {name: 'dc1'}},
    ]
};
```

Each scenario that is created in ailtire has a file that holds all of the information about the scenario.
For more information on the direcotry sturcture of the scenario see [scenario definition](scenario) for more information.

## See Also
* [ailtire scenario](cli-scenario)
