const APackage = require('../../Server/APackage');

module.exports = {
    friendlyName: 'get',
    description: 'Get the Packages',
    inputs: {
        id: {
            description: 'The name of the package',
            type: 'string',
            required: true
        },
    },

    fn: function (inputs, env) {
        try {
            let pkg = APackage.getPackage(inputs.id);
            let jpkg = processPackage(pkg, true);
            env.res.json(jpkg);
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
        handlers: {}
    }

    for(let iname in pkg.interface) {
        let interface = pkg.interface[iname];
        jpkg.interface[iname] = {
            friendlyName: interface.friendlyName,
            description: interface.description,
            inputs: interface.inputs,
            static: interface.static
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
        let uc = pkg.usecases[uname];
        jpkg.usecases[uname] = uc;
    }
    for(let hname in pkg.handlers) {
        jpkg.handlers[hname] = pkg.handlers[hname];
    }
    return jpkg;
}
