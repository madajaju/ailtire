
module.exports = {
    name: 'examplestacks',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 'examplestacks_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 'examplestacks_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 'examplestacks_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
