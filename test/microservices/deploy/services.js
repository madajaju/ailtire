module.exports = {
    services: {
        servicea: {
            image: "ailtire_simple_service:latest",
            interface: {
                '/a': { path: '/', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
            },
        },
        serviceb: {
            image: "ailtire_simple_service:latest",
            interface: {
                '/b': { path: '/', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
            },
        },
        servicec: {
            image: "ailtire_simple_service:latest",
            interface: {
                '/c': { path: '/', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
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
