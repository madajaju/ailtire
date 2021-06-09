
module.exports = {
    name: '_ts',
    contexts: {
        dev: {
            type: 'swarm',
            tag: '_ts_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: '_ts_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: '_ts_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
