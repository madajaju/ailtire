
class AHandlers {
    static definition = {
        name: 'AHandlers',
        description: 'This represents a collection of Handlers for a specific Event that is being watched.',
        attributes: {
            description: "This is the description of the collection of handlers.",
        },
        associations: {
            handlers: {
                type: "AHandler",
                description: "The actual Handler that will perform something when the event is captured.",
            },
            event: {
                type: 'AEvent',
                description: "This is the event that is being watched.",
                cardinality: 1,
                composition: false,
                owner: false,
            },
            package: {
                type: "APackage",
                description: "This is the package that owns the handlers.",
                cardinality: 1,
                composition: false,
                owner: false,
                transient: true,
            }
        },
    }
}

module.exports = AHandlers;

