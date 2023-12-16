module.exports = {
    friendlyName: 'error',
    description: 'Errors in an app',
    static: true,
    inputs: {
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        console.log(global.ailtire.error);
        env.res.json(global.ailtire.error);
        env.res.end();
        return global.ailtire.errors;
    }
};

