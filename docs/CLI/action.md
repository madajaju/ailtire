---
layout: default 
title: ailtire action
permalink: cli-action
parent: Command Line Interface
---

# ailtire action

Manage ailtire actions. This includes the creation of an actions.

## Synopsis

```shell
ailtire action <command> [args]
ailtire action create --name "myaction" --package "myPackage"
ailtire action create --name "myaction" --package "myPackage" --model "mymodel"
```

## Description

This command creates an action for the package, placed in the interface directory.
Or in the model directory if the model parameter is given as well.

## Generated Assets

This command will generate an action *.js file based on the name of the action.
The following is an example of the action file for myaction.js
```javascript
module.exports = {
    friendlyname: 'myaction',
    description: 'Description of the action',
    static: false, // true is for class methods. false is for object based.
    inputs: {
        param1: {
            description: 'description of the parameter',
            type: 'object', // string|boolean|number|json|object
            required: true // true or false for required parameter.
        },
    },

    exits: { 
        success: (retval) => {
            return retval;
        },
        json: (retval) => {
            return {id:retval.id}
        }
    },

    // This is the function that is run when the action is called.
    fn: function (obj, inputs, env) {
        return obj;
    }
};
```

See [Action Page](action) for more information about action definitions and calling them.
