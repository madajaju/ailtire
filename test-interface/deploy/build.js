
module.exports = {
    web: {
        dir: '..',
        file: 'deploy/web/Dockerfile',
        tag: 'test-interface_web',
        env: {

        }
    },
    doc: {
        dir: '../docs',
        file: '../deploy/doc/Dockerfile',
        tag: 'test-interface_doc',
        env: {

        }
    }
}
