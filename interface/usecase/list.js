module.exports = {
    friendlyName: 'list',
    description: 'List the Actors',
    inputs: {
    },

    fn: function (inputs, env) {
        let firstPass = {};
        let retval = {};
        for(let ucname in global.usecases) {
            let uc = global.usecases[ucname];
            firstPass[ucname] = addSubUseCase(uc);
        }

        // Now clean up the list to only show the top level ones.
        for(let ucname in firstPass) {
            if(!firstPass[ucname].parent) {
               retval[ucname] = firstPass[ucname];
            }
        }
        env.res.json(retval);
    }
};
function addSubUseCase(uc) {
    let retval = {
        name: uc.name,
        description: uc.description,
        actors: uc.actors,
        scenarios: uc.scenarios,
        method: uc.method,
        package: uc.package,
        extended: {},
    }
    for(let sucName in uc.extended) {
        let suc = uc.extended[sucName];
        retval.extended[sucName] = addSubUseCase(suc);
        suc.parent = true;
    }
    return retval;
}


