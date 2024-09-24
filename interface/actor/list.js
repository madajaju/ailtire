// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Actors',
    inputs: {
        
    },
    outputs: {
        json: (obj) => { return obj; },
        success: (obj) => { return obj; }
    },

    fn: function (inputs, env) {
        return global.actors;
    }
};


