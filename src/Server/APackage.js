module.exports = {
    getPackage: (pkgName) => {
        if (global.packages.hasOwnProperty(pkgName)) {
            return global.packages[pkgName];
        } else {
            for (let name in global.packages) {
                if (name.toLowerCase() === pkgName.toLowerCase()) {
                    return global.packages[name];
                }
            }
        }
        throw new Error("Package Not Found:" + className);
    }
}

