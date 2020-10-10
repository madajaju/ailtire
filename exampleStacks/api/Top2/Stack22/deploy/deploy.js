
module.exports = {
    name: 't_s22',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 't_s22_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 't_s22_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 't_s22_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
