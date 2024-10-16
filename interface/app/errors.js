module.exports = {
    friendlyName: 'error',
    description: 'Error an app',
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
        if(env.res) {
            if(ailtire.global.errors) {
                env.res.json(ailtire.global.errors);
            }
        }
        return ailtire.global.errors;
    }
};

