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
            try {
                sdata = _toJSON(sdata);
            } catch(e) {
                console.error(e);
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

function _toString(obj, cache) {
    let retval = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return;
            } else {
                cache.set(value,true);
                return value;
            }
        }
        return value;
    });
    return retval;
}
function _toJSON(obj) {
    let cache = new Set();
    function clone(obj) {
        // if it is a primitive or function, return as is
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        // if circular detected, return undefined
        if (cache.has(obj)){
            return undefined;
        }
        cache.add(obj);
        // handle Array
        if (Array.isArray(obj)) {
            let newArray = [];
            for(let value of obj){
                newArray.push(clone(value));
            }
            return newArray;
        }
        // handle generic object
        let newObj = {};
        for(let key in obj){
            newObj[key] = clone(obj[key]);
        }
        return newObj;
    }
    return clone(obj);
}