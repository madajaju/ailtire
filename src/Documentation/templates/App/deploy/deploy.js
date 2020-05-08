
module.exports = {
    dev: {
        type: 'swarm',
        tag: '<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    test: {
        type: 'swarm',
        tag: '<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    prod: {
        type: 'swarm',
        tag: '<%= shortname %>_dev',
        file: 'docker-compose.yml',
        env: {}
    }
}
