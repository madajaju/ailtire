const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'show',
    description: 'Show the application',
    inputs: {
        name: {
            description: 'The scope name of the actor',
            type: 'string',
            required: true
        },
    },

    fn: function (inputs, env) {
        let actor = global.actors[inputs.name];
        env.res.end(renderer.render('default', 'actor/show', {actor: actor, app: global.topPackage}));
    }
};

