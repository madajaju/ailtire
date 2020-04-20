/**
 * model.js
 *
 * @description :: a model definition template
 */
class MetaData {
    static definition = {
        name: 'MetaData',
        description: 'MetaData class representing a name value pair attached to the data',
        attributes: {
            name: {
                type: 'string',
                required: true,
                unique: true,
            },
            value: {
                type: 'string',
                required: true,
                unique: false,
            }
        },
        associations: {
            metadata: {
                type: 'DataInstance',
                unique: false, // if unique then store it as a map by default.
                cardinality: '1', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: false,
                owner: false,
                via: 'nameoftheotherside', // this implies navigability meaning i can go backwards
            }
        },
    };
}
module.exports = MetaData;
