module.exports = {
    services: {
        web: {
            image: '<%= ancestors %>_<%= shortname %>_web',
            volumes: {
                docker: { source: "/var/run/docker.sock", target: "/var/run/docker.sock" }
            },
            interface: {
                "/<%= shortname %>": { path: '/', port: 3000, protocol:"http"},
                "/<%= shortname %>/socket.io": { path: '/socket.io', port: 3000, protocol:"http"},
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
            80: 3000,
            443: 3000,
        }
    },
    data: {

    },
    networks: {

    }
}
