const funcHandler = require('../Proxy/MethodProxy');
const Action = require('../Server/Action');
const clientio = require('socket.io-client');

module.exports = {
    // Pass an array of pattern and server url
    addServers: (servers) => {
        if(!global.hasOwnProperty('servers')) {
            global.servers = [];
        }
        for(let i in servers) {
            let server = servers[i];
            let url = 'http://' + server.url;
            global.servers.push( {
                pattern: server.pattern,
                socket: clientio(url),
                url: server.url
            })
        }
    },
    addHandlers: (socket) => {
        for (let event in global.handlers) {
            // Make sure the handlers are only installed once.
            if (!global.handlers[event]._installed) {
                console.log("Install Handle Event:", event);
                global.handlers[event]._installed = true;
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
        let sdata = data.toJSON;
        if(!sdata) {
            sdata = data;
        }
        for(let i in global.servers) {
            let server = global.servers[i];
            server.socket.emit(nevent, sdata);
        } 
        global.io.emit(nevent, sdata);
        // Check to see if the current server handles this event.
        // If it does then call the Call the handlers defined.
        // This allows for a server to have events handled.
        if (global.handlers.hasOwnProperty(nevent)) {
            callActions(nevent, data);
        }
    }
}
const callActions = (event, data) => {
    console.log("Handled Event:", event);
    for (let i in global.handlers[event].handlers) {
        let handler = global.handlers[event].handlers[i];
        if (handler.hasOwnProperty('action')) {
            let action = Action.find(handler.action);
            if (action) {
                let convertedData = data;
                if (handler.hasOwnProperty('fn')) {
                    convertedData = handler.fn(data);
                }
                funcHandler.run(action, convertedData, event);
            } else {
                console.error("Action not found, for event!", handler)
            }
        } else {
            handler.fn(data, event);
        }
    }
}
