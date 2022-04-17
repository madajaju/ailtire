// const rst = require('../../src/Documentation/rst.js');
// const path = require('path');
const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'show',
    description: 'Show the application',
    inputs: {
    },

    fn: function (inputs, env) {
        env.res.end(renderer.render('default', 'app/show', {name: "MyApp", app: global.topPackage}));
    }
};



