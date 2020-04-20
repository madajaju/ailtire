/**
 * model.js
 *
 * @description :: a model definition template
 */
class DataBluePrint {
    static definition = {
        name: 'DataBluePrint',
        description: 'DataBluePrint is a blue print on how the data can be used, managed, and ingested.',
        attributes: {
            name: {
                type: 'string',
            }
        },
        associations: {
            adaptors: {
                type: 'DataAdaptor',
                cardinality: 'n', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: false,
                owner: true,
            },
            flows: {
                type: 'DataFlow',
                cardinality: 'n', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
                composition: false,
                owner: true,
                via: 'blueprint',
            }
        },
    };
}

module.exports = DataBluePrint;
