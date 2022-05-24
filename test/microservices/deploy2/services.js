module.exports = {
    services: {
        servicea: {
            image: "testms:latest",
            type: 'stack',
            interface: {
                '/a0': { path: '/', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
            },
        },
        serviceb: {
            image: "testms:latest",
            type: 'stack',
            interface: {
                '/b0': { path: '/', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
                AILTIRE_PORT: 3000
            },
        },
        servicec: {
            image: "testms:latest",
            type: 'stack',
            interface: {
                '/c0': { path: '/', port: 3000, protocol:"http"},
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
