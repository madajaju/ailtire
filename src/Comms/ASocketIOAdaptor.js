const funcHandler = require('../Proxy/MethodProxy');
const AClass = require('../Server/AClass');
const Action = require('../Server/Action');
const clientio = require('socket.io-client');
const ABaseCommsAdaptor = require('./ABaseCommsAdaptor');
const AEvent = require("../Server/AEvent");
const { Server } = require("socket.io");

class ASocketIOAdaptor extends ABaseCommsAdaptor {
    constructor(config) {
        super(config);
        this.servers = [];
        this.id = "SocketIO" + global.ailtire.config.prefix;
        const io = new Server(this.config.http, {path: config.urlPrefix + '/socket.io/'});
        const io2 = new Server(this.config.http, {path: '/socket.io/'});
        this.topicName = config.topic || config.prefix || 'ailtire';

        this.servers.push({pattern: '*', socket:io, url: io._path});
        this.servers.push({pattern: '*', socket:io2, url: io._path});
        let me = this;
        io2.on('connection', (msocket) => {
            console.log("Connection 2 happen!");
            // io2.emit("ConnectedEdge", "Connected Edge made it");
            AEvent.addHandlers(me);
        });
        io2.on('ailtire.server.started', (msocket) => {
            console.log("Peer Server Started", msocket);
        })
        io.on('connection', function (msocket) {
            console.log("Connection happen!");
            //io.emit("ConnectedEdge", "Connected Edge made it");
            AEvent.addHandlers(me);
        });
    }

    connect(server) {
        let items = server.url.split('/');
        let url = 'http://' + items.shift();
        let childsocket = clientio.connect(url);
        this.servers.push({
            pattern: server.pattern,
            socket: childsocket,
            url: server.url
        });
        childsocket.on('connect', () => {
            let url = `${global.ailtire.config.host}:${global.ailtire.config.port}${global.ailtire.config.urlPrefix}`;
            childsocket.emit('ailtire.server.started', {url: url});
            if (server.connectionEvent) {
                childsocket.emit(server.connectionEvent, server.connectionData);
            }
        });
    }

    publish(event, data) {
        for (let i in this.servers) {
            try {
                let server = this.servers[i];
                server.socket.emit(event, data);
            } catch (e) {
                console.error("Error Emiting:", data, e);
            }
        }
    }

    subscribe(event) {
        for (let i in this.servers) {
            let socket = this.servers[i].socket;
            socket.on(event, async function (data) {
                // Clean up the data.
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
            });
        }
    }
    close() {

    }
}
module.exports = ASocketIOAdaptor;