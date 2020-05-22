const funcHandler = require('../Proxy/MethodProxy');
const Action = require('../Server/Action');

module.exports = {
    addHandlers: (socket) => {
        for (let event in global.handlers) {
            // Make sure the handlers are only installed once.
            if(!global.handlers[event]._installed) {
                console.log("Install Handle Event:", event);
                global.handles[event]._installed = true;
                socket.on(event, function (data) {
                    callActions(event, data);
                });
            }
        }
    },
    emit: (event, data) => {
        // TODO: Could check if the event has the right signature in the data
        const nevent = event.toLowerCase();
        console.log("Event:", nevent);
        // send the event to all clients.
        global.io.emit(nevent, data);
        // Check to see if the current server handles this event.
        // If it does then call the Call the handlers defined.
        // This allows for a server to have events handled.
        if(global.handlers.hasOwnProperty(nevent)) {
            callActions(nevent,data);
        }
    }
}
const callActions = (event, data) => {
    console.log("Handled Event:", event);
    for (let i in global.handlers[event].handlers) {
        let handler = global.handlers[event].handlers[i];
        if (typeof handler === 'string') {
            let action = Action.find(handler);
            if (action) {
                funcHandler.run(action, data, event);
            } else {
                console.error("Action not found, for event!", handler)
            }
        } else {
            handler(data, event);
        }
    }
}
