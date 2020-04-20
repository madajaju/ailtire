/**
 * Data.js
 *
 * @description :: a model definition template
 */

class Data {
    static definition = {
        name: 'Data',
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
                type: 'DataSource',
                cardinality: 1,
                composition: false,
                owner: false,
            },
            instances: {
                type: 'DataInstance',
                cardinality: 'n',
                owner: false,
            }
        },
    }
}

module.exports = Data;

