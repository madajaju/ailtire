---
layout: default
title: ailtire scenario
permalink: cli-scenario
parent: Command Line Interface
has_children: true
---

# ailtire scenario

Manage scenarios in an ailtire applications. This includes the creation and testing of scenarios in an ailtire
application.

## Synopsis

```shell
ailtire scenario <command> [args]

ailtire scenario create --name "My Scenario Name" --usecase "My Use Case" --package "My Package"
ailtire scenario get --id "MyUseCase.MyScenarioName"
ailtire scenario launch --id "MyUseCase.MyScenarioName"
```

## Description

Used to manage scenarios for the use case of a package in the ailtire framework. Once a scenario is created it can be
launched and simulated.

* [ailtire scenario create](cli-scenario-create) - Create a scenario for a use case.
* [ailtire scenario get](cli-scenario-get) - Get information for a scenario.
* [ailtire scenario launch](cli-scenario-launch) - Launch the steps of a scenario.

## Directories

The creation of a scenario *.js file that holds the definition of the scenario.

## See Also

* [ailtire scenario create](cli-scenario-create)
* [ailtire scenario get](cli-scenario-get)
* [ailtire scenario launch](cli-scenario-launch)
