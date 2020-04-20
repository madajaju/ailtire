/**
 * model.js
 *
 * @description :: a model definition template
 */

class DataSource {
    static definition = {
        name: 'DataSource',
        description: 'Represents a physical data source that could be a database, filesystem, block storage',
        attributes: {
            name: {
                type: 'string',
                required: true,
            },
            type: {
                type: 'string',
                default: 'filesystem',
                required: true,
            }
        },
        associations: {
            resource: {
                type: 'Resource',
                cardinality: '1', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: false,
                owner: false,
            },
            data: {
                type: 'Data',
                cardinality: 'n', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: true,
                owner: true,
            }
        },
    };
}
module.exports = DataSource;
