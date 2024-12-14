const funcHandler = require('./MethodProxy');
const AEvent = require('../Server/AEvent');
const AClass = require('../Server/AClass');
const Action = require('../Server/Action');
/*
statenet: {
    StateName: {
        description: "My Description of the state",
        color: "#aaaaaa",
        events: { // Events that can be handled while in this state.
            eventName: {
                StateName: {
                    // Condition checked after the eventName method is called.
                    condition: {
                        description: "...",
                        action: 'methodname',
                        fn: (obj) => { ... },
                    },
                    action: {
                        description: "...",
                        action: 'methodname',
                        fn: (obj) => { return ... },
                    }
                }
            },
            eventName2 ...
        }
        actions: { // Actions to be performed on the entry and exit of this state.
            entry: { // These actions happen when the state is entered and before any action inside the state.
                     // Including the event action if there is any.
                entry1: {
                    description: "...",
                    action: 'methodname'
                    fn: (obj) => { ... }
                 },
            exit: { // These actions happen when the state is being left. After all other actions.
                exit1:
                    description: "..."
                    action: 'methodname'
                    fn: (obj) => { ... }
                }
                ...
        }
    }
}

Example of Converting a Document.
statenet: {
    Created: {
        description: "My Description of the state",
        color: "#aaaaaa",
        events: { // Events that can be handled while in this state.
            convert: {
                Converting: {
                }
            },
        }
    }
    Converting: {
        events: {
            entry.runConversion: {
                Failed: {
                    condition: {
                        fn: (retval) => { return retval.status === 'Failed'; }
                    }
                }
                Converted: {
                    condition: {
                        fn: (retval) => { return retval.status === 'Successful'; }
                    }
                }
            }
        }
        actions: {
            entry: {
                runConversion: {
                    action: runConversion;
                }
            }
        }
    }
}
*/
module.exports = {
    // Check if a statenet will allow the transition from current state
    // To the next state with a call to this method.
    processEvent: (proxy, obj, event, args) => {
        let currentState = proxy.state;
        // This gets the statenet from the current model or its parent.
        let statenet = _getStateNet(proxy.definition);
        
        if(!statenet) {
            console.error("No statenet defined for", proxy.definition.name);
            return;
        }
        // Check for the terminal state. If it is then log a warning.
        if(!statenet.hasOwnProperty(currentState)) {
            console.error("Unknown State:", currentState);
            return;
        }
        // Run the method and return if there are no restrictions on the events that can happen
        if (!statenet[currentState].hasOwnProperty('events')) {
            return _runMethod(proxy, event, args[0]);
        }

        // Check if the event handled is a defined transition. If not then log a warning or reject the call based on
        // configuration in the ailtire config file.
        if (!statenet[currentState].events.hasOwnProperty(event)) {
            let retval = undefined;
            if (global.ailtire.config.statenet && global.ailtire.config.statenet === "strict") {
                console.error(`There is not a transistion from current state ${currentState} with the event ${event} for ${proxy.id}`);
            } else {
                return _runMethod(proxy, event, args[0]);
            }
            return retval;
        }

        // Check the condition of the event this should happen before the event action is called.
        let eventObj = statenet[currentState].events[event];
        // Now iterate over all of the potential states and check the conditions.
        let transition = _checkTransitions(eventObj, proxy);
        // If the transition is set then move forward with the transition.
        if (transition) {
            return _processTransition(statenet, currentState, transition, event, proxy, args[0]);
        }
    }
};

function _processTransition(statenet, currentState, transition, event, proxy, args) {
    _handleExitActions(statenet[currentState], proxy);

    // This handles custom actions and the event method before changing the state.
    // This is the transistion action and event.
    let transistionRetVal = null;
    _executeAction(transition.action, proxy);
    if(proxy.definition.methods.hasOwnProperty(event)) {
        transistionRetVal =  _runMethod(proxy, event, args);
    }

    // Now handle new State and all of the entry actions in the new state.
    proxy._state = transition.state;
    proxy._persist = { dirty: true };


    AEvent.emit(`${proxy.definition.name}.${proxy._state}`, {obj: proxy.toJSON});
    _handleInheritanceEvents(proxy);
    _handleEntryActions(statenet, statenet[transition.state], proxy);
    
    return  transistionRetVal;
}

function _runMethod(proxy, event, arg) {
    if (proxy.definition.methods.hasOwnProperty(event)) {
        return funcHandler.run(proxy.definition.methods[event], proxy, arg);
    }
}

// Get the statenet of the parent model.
function _getStateNet(definition) {
    if (definition.hasOwnProperty('statenet')) {
        return definition.statenet;
    } else if (definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return _getStateNet(parent.definition);
    } else {
        return false;
    }
}

function _checkTransitions(eventObj, proxy) {
    for (let stateName in eventObj) {
        let eventI = eventObj[stateName];
        if (eventI.hasOwnProperty('condition')) {
            if (_executeAction(eventI.condition, proxy)) {
                return { ...eventObj[stateName], state: stateName };
            }
        } else {
            return { ...eventObj[stateName], state: stateName };
        }
    }
    return null;
}

function _handleExitActions(stateObj, proxy) {
    if (stateObj.hasOwnProperty('actions') && stateObj.actions.hasOwnProperty('exit')) {
        for (let aname in stateObj.actions.exit) {
            let action = stateObj.actions.exit[aname];
            _executeAction(action, proxy);
        }
    }
}

function _handleEntryActions(statenet, stateObj, proxy) {
    if(!stateObj) {
       throw new Error("Invalid State transition. Trying to move to a state that does not exist.");
    }
    if (stateObj.hasOwnProperty('actions') && stateObj.actions.hasOwnProperty('entry')) {
        for (let aname in stateObj.actions.entry) {
            let action = stateObj.actions.entry[aname];
            try {
                let retval = _executeAction(action, proxy);
                // Check the current stateObject events to see if there is an entry.${aname}
                // If there is then proceses the event.
                let eventName = `entry.${aname}`;
                let eventObj = stateObj.events[eventName];
                if(eventObj) {
                    let transition = _checkTransitions(eventObj,{status: 'successful', obj: proxy});
                    return _processTransition(statenet, stateObj.name, transition, eventName, proxy, retval);
                }
            } catch(e) {
               // set the retval status to failed.
            }
        }
    }
}

function _executeAction(paction, pobj, pargs) {
    if(paction) {
        if (paction.hasOwnProperty('action')) {
            let action = Action.find(paction.action);
            if (action) {
                return funcHandler.run(action, pobj);
            } else {
                console.error("Action not found, ", action.action);
                return null;
            }
        } else if (paction.hasOwnProperty('fn')) {
            return paction.fn(pobj);
        } else {
            return paction(pobj);
        }
    }
    return;
}

function _handleInheritanceEvents(obj) {
    let definition = obj.definition;
    while (definition.extends) {
        let cls = AClass.getClass(definition.extends);
        definition = cls.definition;
        AEvent.emit(`${definition.name}.${obj._state}`, { obj: obj });
    }
}
