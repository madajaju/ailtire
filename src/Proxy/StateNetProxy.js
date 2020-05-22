const funcHandler = require('./MethodProxy');
const AEvent = require('../Server/AEvent');

/*
statenet: {
    StateName: {
        description: "My Description of the state",
        events: {
            eventName: {
                StateName: {
                    condition: function(obj) { ... },
                    action: function(obj) { ... },
                }
            },
            eventName2 ...
        }
        actions: {
            entry: { entry1: function(obj) { ... } },
            exit: { exit1: function(obj) { ... } }
        }
    }
}
 */
module.exports = {

    // Check if a statenet will allow the transition from current state
    // To the next state with a call to this method.
    processEvent: (proxy, obj, event, args) => {
        // Check that the parameters are valid.
        // console.log("Process Event: ", event, "on", proxy.id, "[", proxy.state, "]");
        let currentState = proxy.state;
        let statenet = proxy.definition.statenet;
        if (!statenet[currentState].hasOwnProperty('events')) {
            console.warn("Terminal State: No more transistions allowed.");
            return;
        }

        if (!statenet[currentState].events.hasOwnProperty(event)) {
            console.warn(`There is not a transistion from current state ${currentState} with the event ${event}`);
            let retval = undefined;
            if(proxy.definition.methods.hasOwnProperty(event)) {
                retval = funcHandler.run(proxy.definition.methods[event], proxy, args[0]);
            }
            return retval;
        }
        // Check the condition of the event
        let eventObj = statenet[currentState].events[event];
        // Now iterate over all of the potential states and check the conditions.
        let transition = null;
        for (let stateName in eventObj) {
            if (stateName.hasOwnProperty('condition')) {
                if (stateName.condition(proxy)) {
                    transition = eventObj[stateName];
                    transition.state = stateName;
                }
            } else {
                transition = eventObj[stateName];
                transition.state = stateName;
            }
        }
        if (transition) {
            // Fire off the after actions in the current state.
            cStateObj = statenet[currentState];
            if (cStateObj.hasOwnProperty('actions')) {
                if (cStateObj.actions.hasOwnProperty('exit')) {
                    for (i in cStateObj.actions.exit) {
                        cStateObj.actions.exit[i](proxy);
                    }
                }
            }
            // Fire the action and then start on the next state.
            if(transition.hasOwnProperty('action')) {
                transition.action(proxy);
            }
            let nStateObj = statenet[transition.state];
            if (nStateObj.hasOwnProperty('actions')) {
                if (nStateObj.actions.hasOwnProperty('entry')) {
                    for (let i in nStateObj.actions.entry) {
                        cStateObj.actions.entry[i](proxy);
                    }
                }
            }
            let retval = undefined;
            if(proxy.definition.methods.hasOwnProperty(event)) {
                retval = funcHandler.run(proxy.definition.methods[event], proxy, args[0]);
            }
            // Now call the event method.
            obj._state = transition.state;
            // console.log("Moved to State:", obj._state);

            // Emit an event with the transistion.
            AEvent.emit(`${obj.definition.name}.${obj._state}`, {obj:proxy});
            return retval;
        }
        else {
            console.error("Cannot transition!");
        }
    }
};

