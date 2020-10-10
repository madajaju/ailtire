
module.exports = {
    name: 't_s1',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 't_s1_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 't_s1_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 't_s1_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
