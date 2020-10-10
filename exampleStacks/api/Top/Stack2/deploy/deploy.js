
module.exports = {
    name: 't_s2',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 't_s2_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 't_s2_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 't_s2_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
