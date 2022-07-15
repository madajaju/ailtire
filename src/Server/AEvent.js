const funcHandler = require('../Proxy/MethodProxy');
const Action = require('../Server/Action');
const clientio = require('socket.io-client');

module.exports = {
    // Pass an array of pattern and server url
    // This should have the following json format
    // servers: [ {url:localhost:3000, pattern: }, ...]
    //
    addServers: (servers) => {
        if(!global.hasOwnProperty('servers')) {
            global.servers = [];
        }
        for(let i in servers) {
            let server = servers[i];
            let items = server.url.split('/');
            let url = 'http://' + items.shift();
            let childsocket = clientio.connect(url);
            global.servers.push( {
                pattern: server.pattern,
                socket: childsocket,
                url: server.url
            });
            childsocket.on('connect', () => {
                let url = `${global.ailtire.config.host}:${global.ailtire.config.port}${global.ailtire.config.urlPrefix}`;
                childsocket.emit('ailtire.server.started', {url:url});
                if(server.connectionEvent) {
                    childsocket.emit(server.connectionEvent, server.connectionData);
                }
            });
        }
    },
    addHandlers: (socket) => {
        for (let event in global.handlers) {
            // Make sure the handlers are only installed once. per socket.
            if(!global.handlers[event].hasOwnProperty('sockets')) {
                global.handlers[event].sockets = {};
            }
            if (!global.handlers[event].sockets[socket.id]) {
                console.log("Install Handle Event:", event);
                global.handlers[event].sockets[socket.id] = true;
                socket.on(event, function (data) {
                    callActions(event, data);
                });
            }
        }
    },
    emit: (event, data) => {
        // TODO: Could check if the event has the right signature in the data
        try {
            const nevent = event.toLowerCase();
            console.log("Event:", nevent);
            // send the event to all clients.
            let sdata = data.toJSON;
            if (!sdata) {
                if (data.hasOwnProperty('obj')) {
                    sdata = data.obj.toJSON;
                }
            }
            if (!sdata) {
                sdata = data;
            }
            for (let i in global.servers) {
                let server = global.servers[i];
                server.socket.emit(nevent, sdata);
            }
            global.io.emit(nevent, sdata);
            global.io2.emit(nevent, sdata);
            // Check to see if the current server handles this event.
            // If it does then call the Call the handlers defined.
            // This allows for a server to have events handled.
            if (global.handlers.hasOwnProperty(nevent)) {
                callActions(nevent, data);
            }
        }
        catch (e) {
            console.log("Error on Emit:", e);
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
