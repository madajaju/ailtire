
module.exports = {
    web: {
        dir: '..',
        cmd: 'node web/server.js',
        file: 'web/Dockerfile',
        tag: 't_s1_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        cmd: 'node gateway/server.js',
        file: 'gateway/Dockerfile',
        tag: 't_s1_gw',
        env: {

        }
    }
}
