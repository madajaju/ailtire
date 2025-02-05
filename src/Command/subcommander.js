const axios = require('axios');
const YAML = require('yamljs');
const path = require('path');
const Action = require('../Server/Action');
const fs = require('fs');

let baseDir = __dirname;
module.exports = {
    execute: (binDir) => {
        let args = process.argv.slice(2);
        let fullPath = process.argv[1];
        let program = path.basename(fullPath);
        baseDir = binDir;
        _executeCommand(program, args);
    }
}
const _executeCommand = (program, args) => {
    let commands = [];
    while (args.length > 0) {
        if (args[0][0] === '-') {
            break;
        } else {
            commands.push(args.shift());
        }
    }
    if (commands.length > 0) {
        _runCommand(program, commands, args);
    } else {
        if (args.includes('--version') || args.includes('-v')) {
            _helpVersion();
            return;
        }
        _helpTopLevel(program);
    }
};
const _helpGetCommands = (program, topDir) => {
    let helpString = "";
    if (fs.existsSync(topDir)) {
        let dirs = fs.readdirSync(topDir);
        for (let i in dirs) {
            if (dirs[i] !== 'lib' && dirs[i] !== program) {
                if (dirs[i].includes('.js')) {
                    helpString += `\t${dirs[i].replace(/\.js/, '')}`;
                    let action = require(path.resolve(`${topDir}/${dirs[i]}`));
                    for (let iname in action.inputs) {
                        helpString += ` --${iname} <${action.inputs[iname].type}>`;
                    }
                    helpString += `\n\t\t${action.description}\n`;
                } else {
                    helpString += `\t${dirs[i]} [cmd] <args>\n`;
                }
            }
        }
    }
    return helpString;
}
const _helpTopLevel = (program) => {
    let helpString = `Usage: ${program} [cmd]\n`;
    helpString += _helpGetCommands(program, path.resolve(baseDir + '/../api/interface'));
    helpString += _helpGetCommands(program, path.resolve(baseDir + '/.'));
    helpString += '\n';
    helpString += 'ailtire Extensions:\n';
    if (program !== "ailtire") {
        helpString += _helpGetCommands(program, path.resolve(baseDir + '/../node_modules/ailtire/interface'));
    } else {
        helpString += _helpGetCommands(program, path.resolve(baseDir + '/../interface'));
    }
    helpString += '\n';
    console.log(helpString);
    process.exit(0);
}

function _existsDir(dir) {
    try {
        if (fs.statSync(dir).isDirectory()) {
            return true;
        }
    } catch (e) {
        return false;
    }
}

const _runCommand = (program, commands, args) => {
    // Find the command in the current directory.
    let action = _findAction(commands, args, baseDir);
    if (action) {
        _executeAction(action, args);
        return;
    }
    // Then look in the api directory for the application.
    let topDir = path.resolve(baseDir + '/../api');
    action = _findAction(commands, args, path.resolve(topDir, 'interface'));
    if (action) {
        _postAction(action, args);
        return;
    } else {
        action = _searchAction(commands, args, path.resolve(`${topDir}`));
        if (action) {
            _postAction(action, args);
            return;
        }
    }
    // Now check the ailtire directory to see if there is something there.
    if (program !== "ailtire") {
        let ailtireDir = path.resolve(`${baseDir}/../node_modules/ailtire`);
        action = _findAction(commands, args, path.resolve(ailtireDir, "interface"));
        if (action) {
            _executeAction(action, args);
            return;
        }
    } else {
        action = _findAction(commands, args, path.resolve(baseDir, "../interface"));
        if (action) {
            _executeAction(action, args);
            return;
        }
    }
    // Nothing hit so give the top level help.
    _helpTopLevel(program);
    return null;
};

const _searchAction = (commands, args, topDir) => {
    if (fs.existsSync(topDir)) {
        let myDirs = fs.readdirSync(topDir);
        let action = null;
        for (let i in myDirs) {
            let dirname = path.resolve(`${topDir}/${myDirs[i]}`);
            if (fs.existsSync(path.resolve(`${dirname}/index.js`))) {
                let pkg = require(path.resolve(`${dirname}/index.js`));
                let name = pkg.shortname;
                if (commands[0] === name) {
                    let newCommand = commands.slice(1);
                    if (newCommand.length === 0) {
                        _helpCommandGroup(commands.join(' '), path.resolve(`${dirname}/interface`));
                        return;
                    }
                    action = _findAction(commands.slice(1), args, path.resolve(dirname, "interface"));
                    if (action) {
                        action.fullName = commands.join(' ');
                        return action;
                    } else {
                        action = _searchAction(newCommand, args, dirname);
                        return action;
                    }
                }
            }
        }
    }
    return null;
};

const _helpCommand = (actionObj) => {
    let errorString = `Usage: ${actionObj.fullName}\n`;
    for (let iname in actionObj.inputs) {
        errorString += ` --${iname} <${actionObj.inputs[iname].type}>\n\t\t${actionObj.inputs[iname].description}\n`;
    }
    console.error(errorString);
    process.exit(0);
}
const _getParameters = (args) => {

    let params = {};
    let i = 0;
    while (i < args.length) {
        if (args[i][0] === '-') {
            let key = args[i++].replace(/-/g, '');
            let value = true;
            if (i < args.length && args[i][0] !== '-') {
                value = args[i++];
            }
            params[key] = value;
        } else {
            console.error("Could not figure out what to do with:", args[i++]);
        }
    }
    return params;
}
const _executeAction = (actionObj, args) => {
    // Create a map from the args
    let params = _getParameters(args);
    if (params.hasOwnProperty('help')) {
        _helpCommand(actionObj);
        return;
    }

    // Check that the args being passed in match the actionObj inputs.
    let data = {}
    for (let ikey in params) {
        if (!actionObj.inputs.hasOwnProperty(ikey)) {
            console.error("Parameter not found: ", ikey);
        } else {
            if (actionObj.inputs && actionObj.inputs[ikey]) {
                let typeAllCAPS = actionObj.inputs[ikey].type.toUpperCase();
                if (typeAllCAPS === 'YAML') {
                    data[ikey] = YAML.load(params[ikey]);
                } else if (typeAllCAPS === 'FILE') {
                    data[ikey] = fs.readFileSync(params[ikey]);
                } else {
                    data[ikey] = params[ikey];
                }
            }
        }
    }
    let failed = false;
    for (let iname in actionObj.inputs) {
        if (actionObj.inputs[iname].required) {
            if (!data[iname]) {
                console.error(`   --${iname} is required!`);
                failed = true;
            }
        }
    }
    if (failed) {
        let errorString = `Usage: ${actionObj.fullName.replace(/\//g, ' ')}\n`;
        for (let iname in actionObj.inputs) {
            errorString += ` --${iname} <${actionObj.inputs[iname].type}>\n\t\t${actionObj.inputs[iname].description}\n`;
        }
        console.error(errorString);
        console.error("Command Failed!");
        process.exit(-1);
    } else {
        Action.execute(actionObj, params).then((retval) =>
        {
            console.log(retval);
        })
        .catch((err) => {
            console.error(err);
        })
        .finally(() => {
            process.exit(0);
        });
    }
}
const _postAction = (action, args) => {
    // Try and load the .ailtire.js file into the config.
    let ailtireFile = path.resolve(baseDir + '/../.ailtire.js');
    let config = {
        host: "localhost",
        port: "3000"
    };
    if (fs.existsSync(ailtireFile)) {
        config = require(ailtireFile);
    }
    let url = `http://${config.host}:${config.port}/${action.fullName.replace(/\s/g, '/')}`;

    let params = _getParameters(args);
    if (params.hasOwnProperty('help')) {
        _helpCommand(action);
        return;
    }
    let data = {}
    for (let aname in params) {
        if (action.inputs && action.inputs[aname]) {
            let typeAllCAPS = action.inputs[aname].type.toUpperCase();
            if (typeAllCAPS === 'YAML') {
                data[aname] = YAML.load(params[aname]);
            } else if (typeAllCAPS === 'FILE') {
                data[aname] = fs.readFileSync(params[aname]);
            } else {
                data[aname] = params[aname];
            }
        }
    }
    let failed = false;
    for (let iname in action.inputs) {
        if (action.inputs[iname].required) {
            if (!data[iname]) {
                console.error(`   --${iname} is required!`);
                failed = true;
            }
        }
    }
    if (failed) {
        let errorString = `Usage: ${action.name.replace(/\//g, ' ')}\n`;
        for (let iname in action.inputs) {
            errorString += ` --${iname} <${action.inputs[iname].type}> - ${action.inputs[iname].description}\n`;
        }
        console.error(errorString);
        console.error("Command Failed!");
    } else {
        axios.post(url, data)
            .then(response => {
                console.log("Connected");
                console.log(response.data);
                process.exit(0);
            })
            .catch(error => {
                console.error("Command Failed. Error Code: ", error.code);
                if (error.cause) {
                    console.error(error.cause);
                }
                process.exit(-1);
            });
    }
}
const _helpVersion = () => {
    // Return the version of the package.json
    let project = require(path.resolve(`${baseDir}/../package.json`));
    console.log(project.version);
    process.exit(0);
}
const _findAction = (commands, args, topDir) => {
    let bin = "";
    let i = 0;
    let testString = topDir;
    let dirOnly = false;
    while (i < commands.length) {
        testString += "/" + commands[i];
        testString = path.resolve(testString);
        i++;
        if (_existsDir(testString)) {
            bin = testString;
            dirOnly = true;
        } else if (fs.existsSync(testString)) {
            bin = testString;
            dirOnly = false;
        } else if (fs.existsSync(testString + '.js')) {
            bin = testString + '.js';
            dirOnly = false;
        } else if (fs.existsSync(testString + '.ts')) {
            bin = testString + '.ts';
            dirOnly = false;
        } else if (fs.existsSync(testString + '/index.js')) {
            bin = path.resolve(testString + '/index.js');
            dirOnly = false;
        }
    }
    if (dirOnly) {
        let myCommand = commands.shift();
        console.log(`Could not find the command: ${commands.join(" ")}\n`);
        _helpCommandGroup(myCommand, bin);
    } else if (bin.length > 0) {
        const actionObj = require(bin);
        actionObj.fullName = commands.join(' ');
        return actionObj;
    }
    return null;
};
const _helpCommandGroup = (program, topDir) => {
    if (!fs.existsSync(topDir)) {
        console.error("Could not find the command!");
        return;
    }
    let helpString = `Usage: ${program} [cmd]\n`;
    helpString += _helpGetCommands(program, topDir);
    console.log(helpString);
    process.exit(0);
}