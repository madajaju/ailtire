// const renderer = require('../../src/Documentation/Renderer.js');
const ANote = require('ailtire/src/Server/ANote');

module.exports = {
    friendlyName: 'rejectItems',
    description: 'Reject Items for generation of artifacts in the architecture.',
    inputs: {
        note: {
            description: 'The id of the note',
            type: 'string'
        },
        items: {
            description: "The ids of the items to reject for generation of artifacts.",
            type: 'string'
        }
    },
    exits: {
        json: (obj) => {
            return obj;
        }
    },

    fn: function (inputs, env) {
        let note =  ANote.get(inputs.note);
        if(note) {
            let items = inputs.items.split(',');
            for(let i in items) {
                note.rejectItem(items[i]);
            }
            return {message: 'Completed'};
        } else {
            return {message: "Note not Found"};
        }
    }
};
