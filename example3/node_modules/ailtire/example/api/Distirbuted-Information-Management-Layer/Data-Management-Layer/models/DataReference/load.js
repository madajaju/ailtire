module.exports = {
    friendlyName: 'load',
    description: 'Create a Application in the System',
    static: true,
    inputs: {
        scope: {
            description: 'The scope of the Data Reference',
            type: 'string',
            required: true
        },
        data: {
            description: 'The information for the Data Reference',
            type: 'object',
            required: true
        },
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (obj, opts) {
        console.log(obj);
        console.log(obj.access);
        console.log(opts);
        return obj;
    }
};
