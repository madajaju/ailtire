const funcHandler = require('../Proxy/MethodProxy');

module.exports = {
    addHandlers: (socket) => {
        for (let event in global.handlers) {
            socket.on(event, function (data) {
                for (let i in global.handlers[event].handlers) {
                    let handler = global.handlers[event].handlers[i];
                    if (typeof handler === 'string') {
                        if (global.actions[handler]) {
                            funcHandler.run(global.actions[handler], event, data);
                        } else {
                            console.error("Action not found, for event!", handler)
                        }
                    } else {
                        handler(data);
                    }
                }
            });
        }
    },
    emit: (event, data) => {
        // TODO: Could check if the event has the right signature in the data
        global.io.emit(event, data);
    }
}