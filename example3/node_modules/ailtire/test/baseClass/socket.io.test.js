const handler = require('../../src/Proxy/ClassProxy');
const io = require('socket.io-client');

describe('Socket Test', () => {
    it('Socket emit', (done) => {
        try {
            const socket = io('http://localhost:8080');
            socket.emit('provision.completed', {data:"MyData", exitStats:"Done"});
            socket.emit('resource.provision', {data:"MyData2", exitStats:"Done2"});
            return done();
        } catch (e) {
            console.error(e);
            return done(e);
        }
    });
    it('Socket on', (done) => {
        try {
            const socket = io('http://localhost:8080');
            socket.on('provision.completed', function(data) {
                return done();
            });
            return done();
        } catch (e) {
            console.error(e);
            return done(e);
        }
    });
});
