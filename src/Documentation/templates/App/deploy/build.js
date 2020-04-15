
module.exports = {
    web: {
        dir: '..',
        file: 'web/Dockerfile',
        tag: '<%= app.name %>_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        file: 'gateway/Dockerfile',
        tag: '<%= app.name %>_gw',
        env: {

        }
    }
}