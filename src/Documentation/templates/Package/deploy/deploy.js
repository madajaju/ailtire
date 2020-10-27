
module.exports = {
    name: '<%= ancestors %>_<%= shortname %>',
    contexts: {
        dev: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_test',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: '<%= ancestors %>_<%= shortname %>_prod',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
