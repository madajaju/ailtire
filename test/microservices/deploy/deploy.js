
module.exports = {
    name: 'testms',
    dir: '.',
    contexts: {
        local: {
            type: 'swarm',
            tag: 'testms:local',
            design: 'services.js',
            env: {}
        },
    }
}
