const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Packages',
    inputs: {
    },

    fn: function (inputs, env) {
        let jpkg = processPackage(global.topPackage);
        env.res.json(jpkg);
    }
};
function processPackage(pkg) {
    let jpkg = {
        name: pkg.name,
        shortname: pkg.shortname,
        description: pkg.description,
        color: pkg.color,
        prefix: pkg.prefix,
        listenPort: pkg.listenPort,
        deploy: pkg.pkg,
        doc: pkg.doc,
        interface: {},
        classes: {},
        usecases: {},
        subpackages: {}
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

    for(let cname in pkg.classes) {
        let cls = pkg.classes[cname].definition;
        jpkg.classes[cname] = { name: cls.name, description: cls.description, methods: cls.methods, attributes: cls.attributes, associations: cls.associations };
    }
    for(let uname in pkg.usecases) {
        let uc = pkg.usecases[uname];
        jpkg.usecases[uname] = uc;
    }
    for(let spkg in pkg.subpackages) {
        jpkg.subpackages[spkg] = processPackage(pkg.subpackages[spkg]);
    }
    return jpkg;
}
