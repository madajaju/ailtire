---
layout: default 
title: ailtire scenario launch 
permalink: cli-scenario-launch 
parent: ailtire scenario 
grand_parent: Command Line Interface
---

# ailtire scenario launch

This will launch a scenario for simulation by running all of the steps in the scenario.

## Synopsis

```shell
ailtire scenario launch --help 
# ailtire scenario launch scenario steps.

# Launch the steps for the scenario.
ailtire scenario launch --id "MyUseCase.MyScenarioName"
```

This will launch the scenario to simulate the architecture be running the steps of all of the scenarios.

## Description

Running the launch command will run each step defined in the scenario *.js file. The steps are run as commands from the 
commandline. All commands are run in the base directory of the application. This includes accessing files with
relative paths from the commandline. For example if a step is defined as:
```javascript
...
    steps: [
        {action: 'mypackage/method', parameters: {name: 'host1', file: './templates/device.yaml'}},
...
```
This will basically run the following from the commandline in the base dir of the application.
```shell
# Converted action to commandline.
myapp mypackage method --name host1 --file './templates/device.yaml'
```
Results of launching the scenario can be seen in the web interface and on the command line output.

## See Also

* [ailtire scenario](cli-scenario)
