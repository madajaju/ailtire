module.exports = {
    friendlyName: 'generateView',
    description: 'Generate a view surface for a model',
    static: true,
    inputs: {
        id: {
            description: 'The id of the model',
            type: 'string',
            required: true
        },
        type: {
            description: 'The type of view to generate',
            type: 'string',
            required: false
        }
    },

    exits: {
        json: (obj) => {
            return obj;
        },
    },

    fn: async function (inputs, env) {
        const cname = inputs.id;
        const type = inputs.type || 'svelte';
        return await AClass.generateView(cname, type);
    }
};
