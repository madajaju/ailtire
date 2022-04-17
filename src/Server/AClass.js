module.exports = {
    getClass: (className) => {
        return _getClass(className);
    },
    getInstances: (className) => {
        let cls = _getClass(className);
        return _getInstances(cls);
    }
}

function _getClass(className) {
    if (global.classes.hasOwnProperty(className)) {
        return global.classes[className];
    } else {
        for (let name in global.classes) {
            if (name.toLowerCase() === className.toLowerCase()) {
                return global.classes[name];
            }
        }
    }
    return 0;
}
function _getInstances(cls) {
    let retval = [];
    if(!global._instances) {
        return [];
    }
    if(cls) {
        if (global._instances.hasOwnProperty(cls.definition.name)) {
            retval = global._instances[cls.definition.name];
        }
        for (let i in cls.definition.subClasses) {
            let instances = _getInstances(_getClass(cls.definition.subClasses[i]));
            for (let j in instances) {
                retval[instances[j].id] = instances[j];
            }
        }
        return retval;
    } else {
        return [];
    }
}
