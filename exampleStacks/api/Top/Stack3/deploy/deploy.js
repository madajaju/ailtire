
module.exports = {
    name: 't_s3',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 't_s3_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 't_s3_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 't_s3_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
