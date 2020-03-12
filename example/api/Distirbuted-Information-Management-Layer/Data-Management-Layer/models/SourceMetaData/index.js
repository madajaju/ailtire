/**
 * model.js
 *
 * @description :: a model definition template
 */

class SourceMetaData {
    static definition = {
        name: 'SourceMetaData',
        description: 'Source meta data about how to connect to the data',
        extends: 'MetaData',
        attributes: {
            connection: {
                type: 'string',
                required: true,
            }
        },
        associations: {
            name: {
                type: 'model',
                unique: true | false, // if unique then store it as a map by default.
                cardinality: 'range', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: true | false,
                owner: true | false,
                via: 'nameoftheotherside', // this implies navigability meaning i can go backwards
            }
        },
    };
}
module.exports = SourceMetaData;
