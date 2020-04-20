
class DataAdaptor {
    static definition = {
        name: 'DataAdaptor',
        description: 'The Data Adaptor is the mechanism that is a proxy to the data in the physical form. For example' +
            'there is a Data Adaptor for a filesystem, SQL database, or a data stream. Data Adaptors handle the ingestion' +
            'of the data, management of the data, and access to the data.',
        attributes: {
            name: {
                type: 'string',
            }
        },
        associations: {
            blueprint: {
                type: 'DataBluePrint',
                cardinality: "n",
                composition: false,
                owner: false,
            }
        }
    };
}

module.exports = DataAdaptor;
