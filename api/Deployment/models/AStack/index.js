
class AStack {
    static definition = {
        name: 'AStack',
        description: 'A Stack definition',
        attributes: {
            name: {
                type: 'string',
                description: 'Name of the stack',
            },
            networks: {
                type: 'json',
                description: 'Network of the stack',
            },
            interface: {
                type: 'json',
                description: 'Interface of the stack',
            },
            policies: {
                type: 'json',
                description: 'Policies of the stack',
            },
            data: {
                type: 'json',
            }
        },
        associations: {
            services: {
                type: 'AService',
                cardinality: 'n',
                composition: true,
                owner: true,
            },
        },
        /*
        statenet: {
            Init: {
                description: "Initial State"
                events: {
                    create: {
                        StateName: { }
                    }
                }
            },
            StateName: {
                description: "My Description of the state",
                events: {
                    eventName: {
                        StateName: {
                            condition: function(obj) { ... },
                            action: function(obj) { ... },
                        }
                    },
                    eventName2 ...
                }
                actions: {
                    entry: { entry1: function(obj) { ... } },
                    exit: { exit1: function(obj): { ... } }
                }
            }
        }
        */
    }
}

module.exports = AStack;

