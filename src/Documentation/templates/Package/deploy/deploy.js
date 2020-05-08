
module.exports = {
    dev: {
        type: 'swarm',
        tag: '<%= ancestors %>_<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    test: {
        type: 'swarm',
        tag: '<%= ancestors %>_<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    prod: {
        type: 'swarm',
        tag: '<%= ancestors %>_<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    }
}
