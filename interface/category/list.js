module.exports = {
    friendlyName: 'list',
    description: 'List the Workflows',
    inputs: {
    },

    fn: function (inputs, env) {
        let categories = global.categories.workflows
        env.res.json(categories);
    }
};


