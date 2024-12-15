// const renderer = require('../../src/Documentation/Renderer.js');
const ANote = require('../../src/Server/ANote.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Notes',
    inputs: {
        json: (obj) => {
            return obj;
        }
    },

    fn: async function (inputs, env) {
        let retval = ANote.list();
        if(env.res) {
            env.res.json(retval);
        }
        return retval;
    }
};