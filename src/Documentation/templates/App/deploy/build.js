
module.exports = {
    web: {
        dir: '..',
        file: 'web/Dockerfile',
        tag: '<%= name %>_web',
        env: {

        }
    },
    doc: {
        dir: '..',
        file: 'doc/Dockerfile',
        tag: '<%= name %>_doc',
        env: {

        }
    }
}