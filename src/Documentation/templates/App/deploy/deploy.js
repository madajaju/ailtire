
module.exports = {
    dev: {
        type: 'swarm',
        tag: '<%= name %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    test: {
        type: 'swarm',
        tag: '<%= name %>_dev',
        file: 'docker-compose.yml',
        env: {}
    },
    prod: {
        type: 'swarm',
        tag: '<%= name %>_dev',
        file: 'docker-compose.yml',
        env: {}
    }
}
