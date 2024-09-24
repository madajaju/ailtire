// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Notes',
    inputs: {
        json: (obj) => {
            return obj;
        }
    },

    fn: async function (inputs, env) {
        const { default: ANote } = await import("../../src/Server/ANote.mjs");
        let retval = ANote.list();
        if(env.res) {
            env.res.json(retval);
        }
        return retval;
    }
};