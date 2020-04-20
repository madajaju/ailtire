const server = require('../../src/Server');

server.start({
    baseDir: './example',
    prefix: '',
    routes: {
        "/model": "/edgemere/diml/dump",
        "/document": "/model/document",
    },
});

describe('Common Physical Layer Test Suite', () => {
    describe('DataCenter Test', () => {
        it('Create a Data Center', (done) => {
            try {
                let dc = new DataCenter({name:'dc1'});
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
        it('Add Device to Data Center', (done) => {
            try {
                let dc = new DataCenter({name:'dc1'});
                let device = dc.addToDevices({name: 'device1', type:'Compute'});
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
});
