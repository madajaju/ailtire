/**
 * model.js
 *
 * @description :: a model definition template
 */
class LineageMetaData {
    static definition = {
        name: 'LineageMetaData',
        description: 'MetaData about the lineage of the Data',
        extends: 'MetaData',
        attributes: {
            creationAction: {
                type: 'string',
                required: true,
            }
        },
        associations: {
            parents: {
                type: 'DataInstance',
                cardinality: 'n', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: true,
                owner: false,
            }
        },
    };
}
module.exports = LineageMetaData ;
