
module.exports = {
    name: '_p',
    contexts: {
        local: {
            type: 'swarm',
            tag: '_p_dev',
            design: 'services.js',
            env: {}
        },
        dev: {
            type: 'swarm',
            tag: '_p_dev',
            design: 'services.js',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: '_p_test',
            design: 'services.js',
            file: 'docker-compose.yml',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: '_p_prod',
            design: 'services.js',
            env: {}
        }
    }
}
