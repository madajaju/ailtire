---
layout: default
title: Workflow
permalink: workflow
parent: Architecture
---

# Workflow

The workflow models how actors interact with the system to deliver business functionality. It is an essential part of business process engineering, as it helps to visualize and optimize the processes in the system, and how different systems interact with each other to deliver value to stakeholders.

## Command Line Interface

```shell
ailtire workflow create --name "Workflow Name" --package "My Package"
```

## Generated Artifacts

When a workflow is created it will generate the following directory structure.

```shell
# At the highest level of the application, this is the definition of the workflow.
api/workflows/WorkflowName.js 
# Below is the definition of a workflow in a package.
api/MyPackage/workflows/WorkflowName.js 
```

The Workflow definition resides in the WorkflowName.js file in the root directory of the workflow. The format of the workflow.js file is as follows.
```javascript
module.exports = {
    name: 'Workflow Name',
    description: 'Description of the Workflow',
    activites: {
        // Each activity should map to a use case, scenario, or another workflow.
        // This is the initial activity in the workflow. Everything starts here
        Init: {
            description: "Initial state for the workflow",
            actor: 'Actor', // This could be an actor or package.
            package: "My Package", // Either actor or package is defined here. They are mutually exclusive.
            inputs: {
                param1: {
                    description: 'This is a description of the parameter', // Description of the parameter
                    type: 'string', // Type of parameter string, number, ref, json,
                    default: 'This is a default', // This is a default value for the parameter
                    required: true // true or false
                }   
            },
            variables: {
                myVariable: `${inputs.param1}Parameter`
            },
            next: {
                "Next Activity": {
                    inputs: {
                        name: `` 
                    }
                },
                "Next Activity Bad Case": {
                    condition: {
                        test: "Is this good?",
                        value: "No",
                    }
                },
                "Next Activity Good Case": {
                    condition: {
                        test: "Is this good?",
                        value: "Yes",
                    }
                }
            },
        },
        "Next Activity": {
            inputs: {
                name: {
                    description: "Name of the team",
                    type: "string",
                },
            } 
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            package: "My Package",
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            package: "My Other Package"
        },
    }
};
````

Workflows are a series of activities that are linked together through transitions. Each activity has its own specific attributes that help define its purpose and function. These attributes comprise of the following:

* name: It refers to the name of the activity and how it is recognized and referenced within the workflow.
* description: It offers a comprehensive description of the activity, which is used for generating documents.
* actor: It is the actor who initiates the workflow. It can include both internal and external actors of the system. Also, it can be used to create a user interface for launching the workflow from a specific actor.
* package: It is the package that owns the workflow. This attribute is mutually exclusive with the actor attribute. The package provides access to the activity interface and the models within the package.
* inputs: It defines the inputs of the workflow, which enables the creation of parameterized workflows, mapping business processes, and actor interactions with the system. Moreover, the inputs generate user interface fields for prompting users to provide input into the workflow.
* variables: It allows the assignment of variables to be used when calling the next activities or evaluating their conditions.
* next: It is a list of activities that are called next in the workflow.

The following is an example of the activities section of a workflow.
```javascript
... 
    activites: {
        // Each activity should map to a use case, scenario, or another workflow.
        // This is the initial activity in the workflow. Everything starts here
        Init: {
            description: "Initial state for the workflow",
            actor: 'Actor', // This could be an actor or package.
            package: "My Package", // Either actor or package is defined here. They are mutually exclusive.
            inputs: {
                ...
            },
            variables: {
                ... 
            },
            next: {
                ... 
            },
        },
        "Next Activity": {
           ... 
        },
        "Next Activity Good Case": {
            ... 
        },
        "Next Activity Bad Case": {
            ...
        },
    }
...

```

## Inputs

To define each input of an activity, the inputs map contains various inputs. The first activity "Init" includes inputs for the workflow itself. Each input has the following attributes: name, description, type, required, and default.

* name: This refers to the name of the input for the activity.
* description: This provides a description of the input for the activity.
* type: This defines the type of input, such as string, number, ref, or json. It helps with the user interface, documentation, and execution of the workflows and activities.
* required: This is either true or false, and it indicates whether the input is required. If it is not present in the activity calling, it will be rejected and throw an error.
* default: This refers to the default value of input. If it is not set, it will be set to undefined.

The following is an example of the inputs section of a activity of a workflow.

```javascript
...

    inputs: {
      param1: {
        description: 'This is a description of the parameter', // Description of the parameter.
                type: 'string', // Type of parameter string,number,ref,json,
      default: 'This is a default', // This is a default value for the parameter
                required: true // true or false
      },
      param2: {
        description: 'This is a description of the second parameter', // Description of the parameter
                type: 'number', // Type of parameter string,number,ref,json,
      default: 100, // The default value is 100
                required: false // true or false
      }
    },

...
```

## Variables

Workflow designers use variables to capture and pass additional information between activities. Variables have three attributes: a name, a description, and a value. The variable name is used to identify it, while the description provides additional information that can be used for documentation, user interface, and execution. The value of a variable can be a string or a function that returns a value to assign to the variable.
* name - The name of the variable.
* description - The description of the variable that can be used for documentation, user interface and execution.
* value - This could be a string or a function that returns a value to assign to the variable.

The following is an example of the variables in activity of a workflow.

``` javascript
variables: {
    variable1: {
        description: "This is my varaible",
        value: `${activity.inputs.param1}MyString` 
    }
    variable2: {
        description: "This is my second variable",
        value: (activity) => { return activity.inputs.param1 + activity.inputs.param2 * 10; },
    }
}
```


## Next Activity

The "next" attribute in an activity definition contains a list of activities that can be launched, based on certain conditions. Each next activity definition includes the following attributes:

* args - This attribute contains the actual inputs required for calling the activity. The args must match the inputs specified in the activity definition.
* condition - This attribute controls the flow of the workflow. Activities can only be launched if the condition returns true. If the condition is not defined, the activity will be launched anyways.
  * description - This attribute provides a description of the condition. It is used for documentation and user interface purposes.
  * fn - This attribute represents the function that is called when the activity is about to be launched. If it returns true, the activity will be launched.

The following is an example of the next section of an activity of a workflow.

``` javascript
next: {
    "Next Activity": {
        args: {
            name: `${activity.inputs.name}`,
            status: (activity) => { return activity.inputs.good; }
        }
        // No condition means this activity fires automatically next.
    },
    "Next Activity Bad Case": {
        args: {
            name: `${activity.inputs.name}`,
            status: (activity) => { return activity.inputs.good; }
        }
        condition: {
            description: "Is this good? [No]",
            fn: (activity) => { return !activity.inputs.good; }
        }
    },
    "Next Activity Good Case": {
         // No args
         condition: {
            description: "Is this good? [Yes]",
            fn: (activity) => { return activity.inputs.value; }
        }
    }
}
```

## User Interface

