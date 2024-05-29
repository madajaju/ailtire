const fs = require("fs");
const AActor = require("../../src/Server/AActor");
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
        doc: {
            descritpion: 'Return the documentation of the actor',
            type: 'boolean',
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
        let actor = AActor.get(aname);
        if(actor) {
            if(env.res) {
                if(inputs.doc) {
                    if(actor.doc && actor.doc.basedir) {
                        if (fs.existsSync(actor.doc.basedir + '/doc.emd')) {
                            actor.document = fs.readFileSync(actor.doc.basedir + '/doc.emd', 'utf8');
                        } else {
                            actor.document = "Enter documentation here.";
                        }
                    }
                }
                actor.workflows = {};
                for(let i in global.workflows) {
                   let workflow = global.workflows[i] ;
                   for(let aname in workflow.activities) {
                       let activity = workflow.activities[aname];
                       if (activity.actor && activity.actor === actor.name) {
                           actor.workflows[workflow.name] = workflow;
                       }
                   }
                }
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
