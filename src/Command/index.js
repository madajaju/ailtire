const sLoader = require('../Server/Loader.js');
const path = require('path');
const Action = require('../Server/Action.js');

module.exports = {
    init: () => {
        let apath = path.resolve('.');

        Action.load(null, '', path.resolve('../src/interface'));
    }
}
