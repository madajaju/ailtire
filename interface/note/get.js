// const renderer = require('../../src/Documentation/Renderer.js');
const ANote = require('../../src/Server/ANote.js');

module.exports = {
    friendlyName: 'get',
    description: 'get a Note',
    inputs: {
        id: {
            description: 'The idea of the note',
            type: 'string'
        }
    },
    exits: {
        json: (obj) => {
            return obj;
        }
    },

    fn: async function (inputs, env) {
        let retval = ANote.get(inputs.id);
        if(env.res) {
            env.res.json(retval);
        }
        return retval;
    }
};
