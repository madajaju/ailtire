
module.exports = {
    name: 'examplestacks_t',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 'examplestacks_t_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 'examplestacks_t_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 'examplestacks_t_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
