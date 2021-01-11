module.exports = {
    getClass: (className) => {
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
    },
    getInstances: (className) => {
        if(!global._instances) {
            return [];
        }
        cls = this.getClass(className);
        if (global._instances.hasOwnProperty(className)) {
            retval = global._instances[className];
        }
        for (let i in cls.definition.subClasses) {
            let instances = getInstances(AClass.getClass(cls.definition.subClasses[i]))
            for (let j in instances) {
                retval[instances[j].id] = instances[j];
            }
        }
        return retval;
    }
}
