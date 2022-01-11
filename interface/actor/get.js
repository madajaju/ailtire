const path = require('path');
module.exports = {
    friendlyName: 'get',
    description: 'Get an Actor',
    static: true,
    inputs: {
        id: {
            description: 'The id of the actor',
            type: 'string',
            required: true
        },
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        // Find the actor from the usecase.
        let aname = inputs.id;
        let actor = findActor(aname);
        if(actor) {
            if(env.res) {
                env.res.json(actor);
            }
            return actor;
        } else {
            console.error("Could not find the Actor:", aname);
            env.res.status(500).send({error: "Actor could not be found"});
        }
        return null;
    }
};

function findActor(aname) {
    if (global.actors.hasOwnProperty(aname)) {
        return global.actors[aname];
    } else {
        for (let a in global.actors) {
            let actor = global.actors[a];
            if (a.toLowerCase() === aname.toLowerCase()) {
                return actor;
            }
            if (actor.name.toLowerCase().replace(/\s/g, '') === aname.toLowerCase().replace(/\s/g, '')) {
                return actor;
            }
            if(actor.shortname.toLowerCase() === aname.toLowerCase()) {
                return actor;
            }
        }
    }
    return null;
}
