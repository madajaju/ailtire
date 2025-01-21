
module.exports = {
    name: '<%= ancestors %>_<%= shortname %>',
    contexts: {
        local: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_dev',
            design: 'services.js',
            env: {}
        },
        dev: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_dev',
            design: 'services.js',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_test',
            design: 'services.js',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_prod',
            design: 'services.js',
            env: {}
        }
    }
}
