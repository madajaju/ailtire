
module.exports = {
    name: 'puml',
    contexts: {
        dev: {
            type: 'swarm',
            tag: 'puml_dev',
            design: 'services.js',
            env: {}
        },
        test: {
            type: 'swarm',
            tag: 'puml_test',
            design: 'services.js',
            env: {}
        },
        prod: {
            type: 'swarm',
            tag: 'puml_prod',
            design: 'services.js',
            env: {}
        }
    }
}
