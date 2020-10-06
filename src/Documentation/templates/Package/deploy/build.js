
module.exports = {
    web: {
        dir: '..',
        cmd: 'node web/server.js',
        file: 'web/Dockerfile',
        tag: '<%= ancestors %>_<%= shortname %>_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        cmd: 'node gateway/server.js',
        file: 'gateway/Dockerfile',
        tag: '<%= ancestors %>_<%= shortname %>_gw',
        env: {

        }
    }
}
