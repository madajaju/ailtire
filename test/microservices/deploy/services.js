module.exports = {
    services: {
        serviceA: {
            image: "ailtire_simple:latest",
            interface: {
                apple: { path: '/a', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
            },
        },
        serviceB: {
            image: "ailtire_simple:latest",
            interface: {
                apple: { path: '/b', port: 3001, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3001
            },
        },
    },
    policies: {

    },
    interface: {
        ports: {
            80: 3000,
            443: 3000,
            6650: 6650,
            8081: 8081,
        }
    },
    data: {

    },
    networks: {

    }
}
