/**
 * DataInstance.js
 *
 * @description :: a model definition template
 */
class DataInstance {
    static definition = {
        name: 'DataInstance',
        description: 'This is an instance of the data',
        attributes: {
            name: {
                type: 'string'
            }
        },
        associations: {
            data: {
                type: 'Data',
                cardinality: '1',
                composition: false,
            },
            reference: {
                type: 'DataReference',
                cardinality: '1',
                composition: false,
            },
            service: {
                type: 'ServiceInstance',
                cardinality: '1',
                composition: false,
            },
            source: {
                type: 'SourceMetaData',
                cardinality: 'n',
                composition: false,
            },
            metadata: {
                type: 'MetaData',
                cardinality: 'n',
                composition: true,
            },
            lineage: {
                type: 'LineageMetaData',
                cardinality: 'n',
                composition: true,
            },
        },
    };
}

module.exports = DataInstance;
