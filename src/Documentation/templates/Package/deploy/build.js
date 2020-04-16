
module.exports = {
    web: {
        dir: '..',
        file: 'web/Dockerfile',
        tag: '<%= ancestors %>_<%= shortname %>_web',
        env: {

        }
    },
    gateway: {
        dir: '..',
        file: 'gateway/Dockerfile',
        tag: '<%= ancestors %>_<%= shortname %>_gw',
        env: {

        }
    }
}