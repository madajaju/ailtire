
module.exports = {
    name: 't_s21',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 't_s21_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 't_s21_dev',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 't_s21_dev',
            file: 'docker-compose.yml',
            env: {}
        }
    }
}
