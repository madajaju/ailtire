const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'show',
    description: 'Show the application',
    inputs: {
    },

    fn: function (inputs, env) {
        env.res.end(renderer.render('default', 'actor/list', {actors: global.actors, app: global.topPackage}));
    }
};


