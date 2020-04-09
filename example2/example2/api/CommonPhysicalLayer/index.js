module.exports = {
    shortname: 'CPL',
    name: 'Command Physical Layer',
    description: 'Command Physical Layer is a package that contains...',
    color: '#lightgray',
    events: { // These are events that emitted from the subsystem. If they are explicit then they will be available for
        // consumption outside of the susbsystem.
        // In a Pub/Sub these events are published to the bus.
        'device.created': {
            description: 'Device is created in the physical Layer',
            data: {
                device: {
                    type: 'Device'
                }
            },
        },
        'provision.completed': {
            description: 'Device is created in the physical Layer',
            data: {
                resourceID: {
                    type: 'string',
                    description: 'resource Request ID for the provision',
                },
                exitStatus: {
                    type: 'string',
                    description: 'Exit Status of the provision that was requested'
                }
            }
        },
    }
};
