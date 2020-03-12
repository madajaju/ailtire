
class PhysicalProfile {
    static definition = {
        name: 'PhysicalProfile',
        description: 'The Physical Profile contains the capabilities, availability, reserves and' +
            'metrics of the element in the physical domain',
        attributes: {
        },
        associations: {
            capabilities: {
                type: 'MetricComposite',
                description: 'Capabilities of the element',
                owner: true,
                unique: true,
                cardinality: 1
            },
            available: {
                type: 'MetricComposite',
                cardinality: 1,
                owner: true,
                unique: true,
                description: 'Availability of the element'
            },
            reserved: {
                type: 'MetricComposite',
                cardinality: 1,
                owner: true,
                unique: true,
                description: 'Reservations of the element'
            },
            metrics: {
                type: 'MetricComposite',
                cardinality: 1,
                owner: true,
                unique: true,
                description: 'Metrics of the element'
            }
        }
    }
}

module.exports = PhysicalProfile;

