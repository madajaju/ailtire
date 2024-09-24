// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'acceptItems',
    description: 'Accept Item for generation of artifacts in the architecture.',
    inputs: {
        note: {
            description: 'The id of the note',
            type: 'string'
        },
        items: {
            description: "The ids of the items to accept for generation of artifacts.",
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
        
        let note =  ANote.get(inputs.note);
        if(note) {
            let items = inputs.items.split(',');
            for(let i in items) {
                await note.acceptItem(items[i]);
            }
            return {message: 'Completed'};
        } else {
            return {message: "Note not Found"};
        }
    }
};
