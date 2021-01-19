---
layout: default
title: actor
permalink: actor
has_children: true
parent: Architecture
---

# Actor

Actor is a key element of bouquet that genreates artifacts for the actor of the system. This includes
views, Command Line Interface, Documentation etc...

The key here is to show how the actor works with the system. To demonstrate this a top level landing page
is created for the web ui that shows all of the actors of the system. Clicking on the actor will then
go to a landing page for the actor which will show all of the actions that can be performed for the
actor.

The same should be true for the CLI for the system as well. Only the commands that are allowed the actor
should be avialable. the experience for the Actor should be changed based on their use cases. The underlying
actions should be the same but the UseCases might be different.

## Command Line Interface

Command line interface for the generation of the artifacts of the Actor. See [ailtire actor](cli-actor) for more
information.

```shell
ailtire actor create --name "Actor Name"
```

## Generated Artifacts

Here is the directory of the generated artifacts.
* actors - base directory for all actors.
  * MyActor - directory for the actor named "My Actor"
    * index.js - definition file for "My Actor"
    * doc - additional documentation for "My Actor"
  
### index.js
The definition of the actor can be found in the index.js file.
```javascript
module.exports = {
    name: 'My Actor',
    shortname: 'myActor', // Used to access the actor in designing the architecture.
    description: 'A short descrition of the Actor',
};

```
