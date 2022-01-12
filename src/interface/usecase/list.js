module.exports = {
    friendlyName: 'list',
    description: 'List the Actors',
    inputs: {
    },

    fn: function (inputs, env) {
        env.res.json(global.usecases);
    }
};


