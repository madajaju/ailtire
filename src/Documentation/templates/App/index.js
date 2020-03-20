const server = require('ailtire');

server.listen( {
    baseDir: '.',
    prefix: '',
    routes: {
        "/document": "/model/document"
    },
    listenPort: 8080
});
