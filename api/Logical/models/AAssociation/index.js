
class AAssociation {
    static definition = {
        name: 'AAssociation',
        description: 'This represents an association between to classes.',
        attributes: {
            name: {
                type: 'string',
                description: 'Name of the association',
            },
            type: {
                type: 'string',
                description: 'The Class of the association',
            },
            cardinality: {
                type: 'string',
                description: 'The Cardinality of the association. n or 1',
            },
            composition: {
                type: 'boolean',
                description: 'Composition means that the association is an aggregation. It helps with the object managment. If there is composition then the objects in this association cannot exist without the parent',
            },
            owner: {
                type: 'boolean',
                description: "If true then this object owns the relationship. This is helpful for lifecycle management."
            },
            via: {
                type: 'string',
                description: "Automatically creates the back link in the associated object. This handles the traversing of the graph as well.",
            },
            service: {
                type: 'string',
                description: 'Remote service that owns the associated object.',
            },
            remoteType: {
                type: 'string',
                description: 'Remote model type represented by an ARemoteReference association.',
            },
            transient: {
                type: "boolean",
                description: "True if the attribute is not stored presistently",
            },
            description: {
                type: 'string',
                description: 'Description of the attribute',
            },
            items: {
                type: 'json',
                description: 'Items of the association',
            },
            parent: {
                type: 'json',
                description: "The owner of the association",
            },
        },
        associations: {
        },
    }
}

module.exports = AAssociation;
