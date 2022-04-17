const fs = require("fs");
module.exports = {
    friendlyName: 'set',
    description: 'Set an Actor documentation',
    static: true,
    inputs: {
        id: {
            description: 'Id of the actor',
            type: 'string',
            required: true
        },
        summary: {
            descritpion: 'Summary of the actor',
            type: 'string',
            required: false
        },
        document: {
            descritpion: 'Documentation of the actor',
            type: 'string',
            required: false
        }
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
            actor.description = inputs.summary;
            if(actor.doc && actor.doc.basedir) {
                fs.writeFileSync(actor.doc.basedir + '/doc.emd', inputs.documentation)
            }
            let saveActor = {
                name: actor.name,
                shortname: actor.shortname,
                description: inputs.summary
            }
            let actorDef = `module.exports = ${JSON.stringify(saveActor, null, 3)} ;`;
            let filename = actor.dir + '/index.js';
            fs.writeFileSync(filename, actorDef);

            if(env.res) {
                env.res.redirect('/web/');
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
