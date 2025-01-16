const funcHandler = require('../Proxy/MethodProxy');
const Action = require('../Server/Action');
const AClass = require('./AClass');

module.exports = {
    // Pass an array of pattern and server url
    // This should have the following json format
    // servers: [ {url:localhost:3000, pattern: }, ...]
    //
    addServers: (servers) => {
        for(let i in servers) {
            let server = servers[i];
            for(let j in global.ailtire.comms.services) {
                let commsService = global.ailtire.comms.services[j];
                commsService.connect(server);
            }
        }
    },
    addHandlers: async (adaptor) => {
        for (let event in global.handlers) {
            // Make sure the handlers are only installed once. per socket.
            if(!global.handlers[event].hasOwnProperty('adaptors')) {
                global.handlers[event].adaptors = {};
            }
            if (!global.handlers[event].adaptors[adaptor.id]) {
                global.handlers[event].adaptors[adaptor.id] = true;
                await adaptor.subscribe(event);
            }
        }
    },
    emit: (event, data) => {
        // TODO: Could check if the event has the right signature in the data
        try {
            const nevent = event.toLowerCase();
            // console.log("Event:", nevent);
            // send the event to all clients.
            let sdata = data.toJSON;
            if (!sdata) {
                if (data.hasOwnProperty('obj')) {
                    sdata = data.obj.toJSON;
                }
            }
            sdata = sdata || data;
            try {
                sdata = _toJSON(sdata);
            } catch(e) {
                console.error("Problem converting event message to JSON", e);
            }
            for(let i in global.ailtire.comms.services) {
                let commsService = global.ailtire.comms.services[i];
                commsService.publish(nevent, sdata);
            }
            // Check to see if the current server handles this event.
            // If it does then call the Call the handlers defined.
            // This allows for a server to have events handled.
            if (global.handlers.hasOwnProperty(nevent)) {
                callActions(nevent, data);
            }
        }
        catch (e) {
            console.log("Error on Event Emit:", e);
        }
    }
}
const callActions = async (event, data) => {
    console.log("Handled Event Locally:", event);
    // This is first class object assigned to a class.
    if (data.obj.hasOwnProperty('definition') && data.obj.hasOwnProperty('_attributes')) {
        let cls = AClass.getClass(data.obj.definition.name);
        data.obj = await cls.findDeep(data.obj._attributes.id);
    }
    // Ok now call the handlers.
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
const sanitizeString = (input) => input.replace(/"/g, ``).replace(/'/g, ``);
function _toJSON(obj) {
    let cache = new Set();
    function clone(obj) {
        // if it is a primitive or function, return as is
        if (obj === null || typeof obj !== 'object') {
            if(typeof obj === 'string') {
                return sanitizeString(obj);
            } else {
                return obj;
            }
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