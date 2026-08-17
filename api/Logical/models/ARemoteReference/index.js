
class ARemoteReference {
    static definition = {
        name: 'ARemoteReference',
        description: 'This represents a class in the architecture',
        unique: (obj) => obj.rid || obj.name || obj.id,
        attributes: {
            service: {
                type: 'string',
                description: 'Name of the Service',
            },
            type: {
                type: 'string',
                description: 'The type of the Reference on the class.',
            },
            rid: {
                type: 'string',
                description: 'Remote ID of the object on the otherside.',
            },
            displayName: {
                type: 'string',
                description: 'Name of the label for the objects.',
            },
            snapshot: {
                type: 'json',
                description: 'This is a snapshot of the object.',
            },
            snapShotDate: {
                type: "datetime",
                description: "Date and time of the snapshot.",
            }
        },
        associations: {
        }
    }
}

module.exports = ARemoteReference;
