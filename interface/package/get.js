const APackage = require('../../src/Server/APackage');
const fs = require("fs");

module.exports = {
    friendlyName: 'get',
    description: 'Get the Packages',
    inputs: {
        id: {
            description: 'The name of the package',
            type: 'string',
            required: true
        },
        doc: {
            description: 'Get the documentation of the package',
            type: 'boolean',
            required: false
        }
    },

    fn: function (inputs, env) {
        try {
            let pkg = APackage.getPackage(inputs.id);
            let jpkg = processPackage(pkg, true);
            if(env.res) {
                if(inputs.doc) {
                    if(pkg.doc && pkg.doc.basedir) {
                        if(fs.existsSync(pkg.doc.basedir + '/doc.emd')) {
                            jpkg.document = fs.readFileSync(pkg.doc.basedir + '/doc.emd', 'utf8');
                        } else {
                            jpkg.document = "Enter documentation here.";
                        }
                    }
                }
                env.res.json(jpkg);
            }
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
function processPackage(pkg, depth = false) {
    let jpkg = {
        name: pkg.name,
        shortname: pkg.shortname,
        description: pkg.description,
        color: pkg.color,
        prefix: pkg.prefix,
        listenPort: pkg.listenPort,
        deploy: pkg.deploy,
        doc: pkg.doc,
        depends: {},
        interface: {},
        classes: {},
        usecases: {},
        subpackages: {},
        handlers: {},
        workflows: {}
    }

    for(let iname in pkg.interface) {
        let intrface = pkg.interface[iname];
        jpkg.interface[iname] = {
            friendlyName: intrface.friendlyName,
            description: intrface.description,
            inputs: intrface.inputs,
            static: intrface.static
        };
    }
    if(depth) {
        for (let dname in pkg.depends) {
            let depend = pkg.depends[dname];
            jpkg.depends[depend.shortname] = processPackage(depend);
        }
        for (let spkg in pkg.subpackages) {
            jpkg.subpackages[spkg] = processPackage(pkg.subpackages[spkg]);
        }
    }
    for(let cname in pkg.classes) {
        let cls = pkg.classes[cname].definition;
        jpkg.classes[cname] = { name: cls.name, description: cls.description, methods: cls.methods, attributes: cls.attributes, associations: cls.associations };
    }
    for(let uname in pkg.usecases) {
        jpkg.usecases[uname] = pkg.usecases[uname];
    }
    for(let hname in pkg.handlers) {
        jpkg.handlers[hname] = pkg.handlers[hname];
    }
    for(let wname in pkg.workflows) {
        jpkg.workflows[wname] = pkg.workflows[wname];
    }
    return jpkg;
}
