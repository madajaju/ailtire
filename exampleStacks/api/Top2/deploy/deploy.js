
module.exports = {
    name: 'examplestacks_t2',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 'examplestacks_t2_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 'examplestacks_t2_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 'examplestacks_t2_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
