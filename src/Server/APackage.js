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
        // Now check the short name
        for(let name in global.packages) {
            let pkg = global.packages[name];
            if(pkg.shortname === pkgName) {
                return pkg;
            }
        }
        throw new Error("Package Not Found:" + pkgName);
    }
}

