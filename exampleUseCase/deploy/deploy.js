
module.exports = {
    name: 'exampleUseCase',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 'exampleUseCase_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 'exampleUseCase_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 'exampleUseCase_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
