const server = require('../../src/Server');

server.start({
    baseDir: './example',
    prefix: '',
    routes: {
        "/model": "/edgemere/diml/dump",
        "/document": "/model/document",
    },
});

describe('Microservice', () => {
    describe('Microservice Test 1', () => {
        it('No one can access a microservice except through the Parent', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 2', () => {
        it('Siblings communicate with each other', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 3', () => {
        it('Cousins communicate thru common ancestor', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 4', () => {
        it('Service Belongs to parent network and its own if it has children', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
});
