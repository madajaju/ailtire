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
        throw new Error("Class Not Found:" + className);
        return 0;
    }
}
