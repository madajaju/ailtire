module.exports = {
    services: {
        microservice: {
            image: '<%= ancestors %>_<%= shortname %>_microservice',
            volumes: {
                docker: { source: "/var/run/docker.sock", target: "/var/run/docker.sock" }
            },
            interface: {
                "/<%= shortname %>/api": { path: '/', port: 3000, protocol:"http"},
                "/<%= shortname %>/api/socket.io": { path: '/socket.io', port: 3000, protocol:"http"},
            },
            policies: { },
            environment: {
            },
        },
        webserver: {
            image: '<%= ancestors %>_<%= shortname %>_webserver',
            interface: {
                "/<%= shortname %>": { path: '/', port: 5173, protocol:"http"},
            },
            policies: { },
            environment: {
            },
        },
    },
    policies: {

    },
    interface: {
        ports: {
            80: 5173,
            443: 5173,
        }
    },
    data: {

    },
    networks: {

    }
}
