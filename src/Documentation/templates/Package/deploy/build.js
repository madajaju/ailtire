
module.exports = {
    web: {
        dir: '..',
        file: 'web/Dockerfile',
        tag: '<%= shortname %>_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        file: 'gateway/Dockerfile',
        tag: '<%= shortname %>_gw',
        env: {

        }
    }
}