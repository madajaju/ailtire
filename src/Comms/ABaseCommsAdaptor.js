// src/BaseCommsAdaptor.js
class ABaseCommsAdaptor {
    constructor(config) {
        if (this.constructor === ABaseCommsAdaptor) {
            throw new Error("Cannot instantiate abstract class BaseCommsAdaptor directly!");
        }
        this.config = config || {};
    }

    // Abstract method: must be implemented by subclasses
    connect(server) {
        throw new Error("connect() must be implemented by subclass");
    }

    // Abstract method: must be implemented by subclasses
    publish(event, data) {
        throw new Error("publish() must be implemented by subclass");
    }

    // Abstract method: must be implemented by subclasses
    subscribe(event, socket) {
        throw new Error("subscribe() must be implemented by subclass");
    }

    // Optional cleanup method for subclasses
    close() {
        throw new Error("close() must be implemented by subclass");
    }
}

module.exports = ABaseCommsAdaptor;