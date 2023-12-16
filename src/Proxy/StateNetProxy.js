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
*/
module.exports = {

    // Check if a statenet will allow the transition from current state
    // To the next state with a call to this method.
    processEvent: (proxy, obj, event, args) => {
        // Check that the parameters are valid.
        // console.log("....................Process Event: ", event, "on", proxy.id, "[", proxy.state, "]");
        let currentState = proxy.state;
        // This gets the statenet from the current model or its parent.
        let statenet = _getStateNet(proxy.definition);
        // Check for the terminal state. If it is then log a warning.
        if (!statenet[currentState].hasOwnProperty('events')) {
            console.warn("Terminal State: No more transistions allowed.");
            return;
        }

        // Check if the event handled is a defined transition. If not then log a warning or reject the call based on
        // configuration in the ailtire config file.
        if (!statenet[currentState].events.hasOwnProperty(event)) {
            let retval = undefined;
            if (global.ailtire.config.statenet && global.ailtire.config.statenet === "strict") {
                console.error(`There is not a transistion from current state ${currentState} with the event ${event} for ${proxy.id}`);
            } else {
                if (proxy.definition.methods.hasOwnProperty(event)) {
                    retval = funcHandler.run(proxy.definition.methods[event], proxy, args[0]);
                }
            }
            return retval;
        }

        // Check the condition of the event this should happen before the event action is called.
        let eventObj = statenet[currentState].events[event];
        // Now iterate over all of the potential states and check the conditions.
        let transition = null;
        for (let stateName in eventObj) {
            eventI = eventObj[stateName];
            // Check if a condition is set.
            if (eventI.hasOwnProperty('condition')) {
                // If the condition is met then transistion to the new state.
                if(_executeAction(eventI.condition, proxy)) {
                    transition = eventObj[stateName];
                    transition.state = stateName;
                }
            } else { // Transition because there is no transition.
                transition = eventObj[stateName];
                transition.state = stateName;
            }
        }
        // If the transition is set then move forward with the transition.
        if (transition) {
            cStateObj = statenet[currentState];
            // First run all of the actions in the exit of the current state.
            if (cStateObj.hasOwnProperty('actions')) {
                if (cStateObj.actions.hasOwnProperty('exit')) {
                    for (i in cStateObj.actions.exit) {
                        _executeAction(cStateObj.actions.exit[i], proxy);
                    }
                }
            }
            // Fire the action and then start on the next state.
            if (transition.hasOwnProperty('action')) {
                _executeAction(transition.action, proxy);
            }
            let nStateObj = statenet[transition.state];
            if (nStateObj.hasOwnProperty('actions')) {
                if (nStateObj.actions.hasOwnProperty('entry')) {
                    // Fire off the after actions in the current state.
                    for (let i in nStateObj.actions.entry) {
                        _executeAction(nStateObj.actions.entry[i], proxy);
                    }
                }
            }
            // Short circuit it the transition is to itself. Do not call the entry and exit actions.
            if (obj._state === transition.state) {
                return;
            }
            // Change the state of the obj to the new state.
            obj._state = transition.state;
            
            // Emit an event with the transistion.
            AEvent.emit(`${obj.definition.name}.${obj._state}`, {obj: proxy});


            // Now call the event action if there is one. If a method  was called on the class call it here.
            // The method is the implied action of the transition.
            let retval = undefined;
            if (proxy.definition.methods.hasOwnProperty(event)) {
                retval = funcHandler.run(proxy.definition.methods[event], proxy, args[0]);
            }

            // This handles the inheritance model.
            // We need to emit an event for the extends (parent) as well.
            let definition = obj.definition;
            while (definition.extends) {
                let cls = AClass.getClass(definition.extends);
                definition = cls.definition;
                AEvent.emit(`${definition.name}.${obj._state}`, {obj: proxy});
            }
            return retval;
        }
    }
};

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

function _executeAction(paction, pobj, pargs) {
    if (paction.hasOwnProperty('action')) {
        let action = Action.find(paction.action);
        if (action) {
            return funcHandler.run(action, pobj);
        } else {
            console.error("Action not found, for condition!", eventI.condition)
            return null;
        }
    } else if (paction.hasOwnProperty('fn')) {
        return paction.fn(pobj);
    } else {
        return paction(pobj);
    }
}
