
module.exports = {
    web: {
        dir: '..',
        file: 'deploy/web/Dockerfile',
        tag: '<%= name %>_web',
        env: {

        }
    },
    doc: {
        dir: '../docs',
        file: '../deploy/doc/Dockerfile',
        tag: '<%= name %>_doc',
        env: {

        }
    }
}
