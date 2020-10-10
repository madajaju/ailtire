
module.exports = {
    web: {
        dir: '..',
        cmd: 'node web/server.js',
        file: 'web/Dockerfile',
        tag: 't_s3_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        cmd: 'node gateway/server.js',
        file: 'gateway/Dockerfile',
        tag: 't_s3_gw',
        env: {

        }
    }
}
