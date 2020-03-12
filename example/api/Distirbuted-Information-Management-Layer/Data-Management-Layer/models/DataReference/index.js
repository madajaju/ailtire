/**
 * DataReference.js
 *
 * @description :: a model definition template
 */
class DataReference {
    static definition = {
        name: 'DataReference',
        description: 'This reference is how Services access data through an abstract layer',
        attributes: {
            name: {
                type: 'string',
                required: true,
                unique: true,
            },
            connection: {
                type: 'string',
                required: true,
                unique: false,
            }
        },
        associations: {
            instances: {
                type: 'DataInstance',
                cardinality: 'n', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: true,
                owner: false,
                via: 'reference', // this implies navigability meaning i can go backwards
            }
        },
    };
}

module.exports = DataReference;
