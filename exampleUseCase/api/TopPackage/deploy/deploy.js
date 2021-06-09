
module.exports = {
    name: '_tp',
    contexts: {
        dev: {
            type: 'swarm',
            tag: '_tp_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: '_tp_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: '_tp_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
