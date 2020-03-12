const handler = require('../../src/Proxy/ClassProxy');

class MyTest {
    static definition = {
        name: 'MyTest',
        description: 'This class represents data that is stored in the system. It has a relaitonship with a StorageResource' +
            'as all data must have someplace to reside. The access attribute is a catch all for how to access the data.' +
            ' It could be a connection string to a data like a database, a filesystem etc.. Specializations of the ' +
            'DataReference class know what to do\nwith the access attribute.',
        attributes: {
            access: {
                type: 'string',
                description: 'A string that repesents how to access the data. This could be a database connection string,' +
                    ' file system path,etc..'
            }
        },
        associations: {
            source: {
                type: 'MyTest',
                cardinality: 1,
                composition: false,
                owner: false,
            },
            instances: {
                type: 'MyTest',
                cardinality: 'n',
                owner: false,
            }
        }
    };
}

describe('Proxy Test', () => {
    it('First Test Proxy ', (done) => {
        try {

            let MyTestClass = new Proxy(MyTest, handler);
            let mObj = new MyTestClass();
            let mObj2 = new MyTestClass();
            let mObj3 = new MyTestClass();
            mObj.access = "I am here";
            mObj.myOther = 1234;
            mObj.source = mObj2;
            mObj.instances = [mObj2];
            mObj.addToInstances(mObj2);
            mObj.addToInstances(mObj3);
            mObj.removeFromInstances(mObj2);
            mObj.clearInstances(mObj2);
            mObj.destroy();
            console.log(mObj);
            return done();
        } catch (e) {
            console.error(e);
            return done(e);
        }
    });
});
