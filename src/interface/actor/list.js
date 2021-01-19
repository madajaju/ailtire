const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Actors',
    inputs: {
    },

    fn: function (inputs, env) {
        env.res.json(global.actors);
//        env.res.end(renderer.render('default', 'actor/list', {actors: global.actors, app: global.topPackage}));
    }
};


