const funcHandler = require('../Proxy/MethodProxy');
const AClass = require('../Server/AClass');
const Action = require('../Server/Action');
const clientio = require('socket.io-client');
const ABaseCommsAdaptor = require('./ABaseCommsAdaptor');
const AEvent = require('../Server/AEvent');
const { Server } = require('socket.io');

class ASocketIOAdaptor extends ABaseCommsAdaptor {
    constructor(config = {}) {
        super(config);
        this.id = `SocketIO${global.ailtire?.config?.prefix || ''}`;
        this.topicName = config.topic || config.prefix || 'ailtire';
        this.localServers = [];
        this.localSockets = new Set();
        this.peers = new Map();
        this.subscriptions = new Set();

        this._createLocalServer(config.http, config.urlPrefix || '/');
        // The unprefixed endpoint is the browser/web-interface endpoint.
        if ((config.urlPrefix || '/') !== '/') {
            this._createLocalServer(config.http, '/');
        }
    }

    _createLocalServer(http, urlPrefix) {
        const path = this._socketPath(urlPrefix);
        const io = new Server(http, {path});
        this.localServers.push({socket: io, path});

        io.on('connection', socket => {
            this.localSockets.add(socket);
            socket.on('disconnect', () => this.localSockets.delete(socket));
            this._attachSocket(socket);
            AEvent.addHandlers(this);
        });
    }

    _socketPath(prefix) {
        const normalized = prefix === '/' ? '' : `/${prefix.replace(/^\/+|\/+$/g, '')}`;
        return `${normalized}/socket.io/`;
    }

    connect(server) {
        if (!server || !server.url) {
            throw new Error('A websocket peer requires a URL.');
        }
        const target = new URL(server.url);
        const path = target.pathname.endsWith('/') ? target.pathname : `${target.pathname}/`;
        const key = `${target.protocol}//${target.host}${path}`;

        if (this.peers.has(key)) return this.peers.get(key).socket;

        const socket = clientio(`${target.protocol}//${target.host}`, {
            path,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: server.reconnectionDelay || 1000,
            reconnectionDelayMax: server.reconnectionDelayMax || 10000,
            randomizationFactor: server.randomizationFactor ?? 0.5,
        });
        const peer = {socket, definition: server, url: server.url};
        this.peers.set(key, peer);
        this._attachSocket(socket);

        socket.on('connect', () => {
            const config = global.ailtire.config || {};
            const prefix = config.urlPrefix || '/';
            const host = config.host || 'localhost';
            const port = config.port || config.listenPort || 3000;
            socket.emit('ailtire.server.started', {
                url: `${config.protocol || 'http'}://${host}:${port}${prefix}`
            });
            if (server.connectionEvent) {
                socket.emit(server.connectionEvent, server.connectionData);
            }
        });
        socket.on('connect_error', error => {
            console.error(`Unable to connect to websocket peer ${server.url}; retrying`, error.message);
        });
        return socket;
    }

    _attachSocket(socket) {
        for (const event of this.subscriptions) {
            this._attachEvent(socket, event);
        }
    }

    _attachEvent(socket, event) {
        socket.on(event, data => this._handleEvent(event, data));
    }

    async _handleEvent(event, data) {
        data = await this._restoreObject(data);
        const handlers = global.handlers?.[event]?.handlers || [];
        for (const handler of handlers) {
            if (handler.action) {
                const action = Action.find(handler.action);
                if (!action) {
                    console.error('Action not found for event:', handler);
                    continue;
                }
                const convertedData = handler.fn ? handler.fn(data) : data;
                funcHandler.run(action, convertedData, event);
            } else if (handler.fn) {
                handler.fn(data, event);
            }
        }
    }

    async _restoreObject(data) {
        if (!data?.obj?.definition || !data.obj._attributes) return data;
        const cls = AClass.getClass({name: data.obj.definition.name});
        if (cls) data.obj = await cls.findDeep(data.obj._attributes.id);
        return data;
    }

    publish(event, data) {
        for (const {socket} of this.localServers) socket.emit(event, data);
        for (const {socket} of this.peers.values()) {
            if (socket.connected) socket.emit(event, data);
        }
    }

    subscribe(event) {
        if (this.subscriptions.has(event)) return;
        this.subscriptions.add(event);
        for (const socket of this.localSockets) this._attachEvent(socket, event);
        for (const {socket} of this.peers.values()) this._attachEvent(socket, event);
    }

    close() {
        for (const {socket} of this.localServers) socket.close();
        for (const {socket} of this.peers.values()) socket.close();
        this.localServers = [];
        this.localSockets.clear();
        this.peers.clear();
        this.subscriptions.clear();
    }
}

module.exports = ASocketIOAdaptor;
