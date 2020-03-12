const server = require('./src/Server');

server.listen( {
    baseDir: './example',
    prefix: '',
    routes: {
        "/model": "/edgemere/diml/dump",
        "/document": "/model/document",
    },
    listenPort: 8080
});
