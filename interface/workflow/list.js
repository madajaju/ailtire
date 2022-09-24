module.exports = {
    friendlyName: 'list',
    description: 'List the Workflows',
    inputs: {
    },

    fn: function (inputs, env) {
        env.res.json(global.workflows);
//        env.res.end(renderer.render('default', 'actor/list', {actors: global.actors, app: global.topPackage}));
    }
};


