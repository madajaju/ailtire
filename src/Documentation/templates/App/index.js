const server = require('aitire').Server;

server.start( {
    baseDir: '.',
    prefix: '',
    routes: {
        "/model": "/edgemere/diml/dump",
        "/document": "/model/document"
    },
    listenPort: 8080
});
