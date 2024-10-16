// const renderer = require('../../src/Documentation/Renderer.js');

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

    fn: async function (inputs, env) {
        const { default: ANote } = await import("../../src/Server/ANote.mjs");
        let retval = ANote.get(inputs.id);
        for(let i in inputs) {
            retval[i] = inputs[i];
        }
        retval.save();
        return retval;
    }
};
