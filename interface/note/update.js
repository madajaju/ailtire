// const renderer = require('../../src/Documentation/Renderer.js');
const ANote = require('../../src/Server/ANote.js');

module.exports = {
    friendlyName: 'update',
    description: 'update a Note',
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

    fn: function (inputs, env) {
        let retval = ANote.get(inputs.id);
        for(let i in inputs) {
            retval[i] = inputs[i];
        }
        retval.save();
        return retval;
    }
};
