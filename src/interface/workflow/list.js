module.exports = {
    friendlyName: 'list',
    description: 'List the Actors',
    inputs: {
    },

    fn: function (inputs, env) {
        let retval = {};
        for(let ucname in global.usecases) {
            let uc = global.usecases[ucname];
            retval[ucname] = addSubUseCase(uc);
        }
        env.res.json(retval);
//        env.res.end(renderer.render('default', 'actor/list', {actors: global.actors, app: global.topPackage}));
    }
};
function addSubUseCase(uc) {
    let retval = {
        name: uc.name,
        description: uc.description,
        actors: uc.actors,
        scenarios: uc.scenarios,
        method: uc.method,
        extended: {},
    }
    for(let sucName in uc.extended) {
        let suc = uc.extended[sucName];
        retval.extended[sucName] = addSubUseCase(suc);
    }
    return retval;
}


