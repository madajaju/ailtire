/**
 * Module dependencies.
 */

const axios = require('axios');
const YAML = require('yamljs');
const spawn = require('child_process').spawn;
const path = require('path');
const dirname = path.dirname;
const basename = path.basename;
const fs = require('fs');
const commander = require('commander');
const {type} = require("mocha/lib/utils");

// Get the package.json to get the current working directory and project name.

commander.executeSubCommand = function (argvAll, commands, args, subcommand) {

    // name of the subcommand, link `pm/install`
    let bin = commands.join('/');

    // In case of globally installed, get the base dir where executable
    //  subcommand file should be located at
    let baseDir = this._scriptPath;
    if (!baseDir) {
        baseDir = path.resolve(__dirname + '/..');
    }


    // prefer local `./<bin>` to bin in the $PATH

    // whether bin file is a js script with explicit `.js` or `.ts` extension
    let found = findCommand(bin, baseDir);
    if (!found.bin) {
        // Now check the actions.
        found = findAction(bin, baseDir);
        if (!found._path) {
            // Try and print out the help for the command
            // if it cannot be found then show the help for the command
            found = findHelp(bin, baseDir);
            args = ['help'];
            if (!found.bin) {
                this.help();
                console.error('error: "%s" does not exist, try --help', args.join(' '));
                return;
            }
        } else {
            if(args[0] === '--help' || args[0] === '-help') {
                if(Object.keys(found).length > 2) {
                    helpGroupAction(found);
                } else {
                    helpAction(found._action);
                }
            } else {
                runAction(found._action, args);
            }
        }

    } else {
        runCommand(found, args);
    }
};

function exists(file) {
    try {
        if (fs.statSync(file).isFile()) {
            return true;
        }
    } catch (e) {
        return false;
    }
}

function existsDir(dir) {
    try {
        if (fs.statSync(dir).isDirectory()) {
            return true;
        }
    } catch (e) {
        if (e) {
            return false;
        }
    }
}

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);


const findHelp = (args, baseDir) => {
    let found = _findHelpCommand(args, baseDir);
    if (!found.act) {
        found = _findHelpAction(args, baseDir);
        if (found.action) {
            found = _helpCommand(found);
        } else {
            found = _helpCommandGroup(found, baseDir);
        }
    }
    return found;
};

const _findHelpCommand = (args, baseDir) => {
    let bin = 0;
    let i = 0;
    let testString = baseDir;
    while (!bin && i < args.length) {
        testString += "/" + args[i];
        i++;
        if (existsDir(testString)) {
            // console.log("Directory Found:", testString);
        } else if (exists(testString)) {
            bin = testString;
        } else if (exists(testString + '.js')) {
            bin = testString + '.js';
        } else if (exists(testString + '.ts')) {
            bin = testString + '.ts';
        } else if (exists(testString + '/index.js')) {
            bin = testString + '/index.js';
        }
    }
    return {bin: bin, args: args.slice(i)};
};

const findCommand = (commands, baseDir) => {
    let found = _findCommand(commands, baseDir);
    if (!found.bin) {
        // Look for the bin in the interface definitions.
        let interfaceDir = path.resolve(baseDir + "/../src/interface");
        let serverDir = path.resolve(baseDir + "/../src/Server");
        serverDir = serverDir.replace(/\\/g, '\/');
        serverDir = serverDir.replace(/\//g, '\/');
        let isAction = _findCommand(commands, interfaceDir);
        if (isAction.bin) {
            var tdir = './.tmp/';
            var tfile = tdir + isAction.bin.replace(interfaceDir, '').split('/').pop();
            let tempString = '#!/usr/bin/env node\n\nconst program = require(\'commander\');\n\n';
            let actionPath = path.resolve(isAction.bin);
            actionPath = actionPath.replace(/\\/g, '\/');
            actionPath = actionPath.replace(/\//g, '\/');
            tempString += `const action = require('${actionPath}');\n`;
            tempString += `const ActionHandler = require('${serverDir}/Action.js');\n`;
            tempString += "global.ailtire = { config: require('" + __dirname.replace(/\\/g, '\/') + "/../../.ailtire.js') };\n";
            let action = require(path.resolve(isAction.bin));
            tempString += `program`;
            for (let iname in action.inputs) {
                let input = action.inputs[iname];
                if (!input.required) {
                    tempString += `\n\t.option('--${iname} <${input.type}>', '${input.description}')`;
                } else {
                    tempString += `\n\t.requiredOption('--${iname} <${input.type}>', '${input.description}')`;
                }
            }
            tempString += ';\n';
            tempString += 'program.parse(process.argv);\n';
            tempString += 'let results = ActionHandler.execute(action,program.opts(), {});\n';
            tempString += 'console.log(results);\n';

            tfile = path.resolve(tfile);
            let dirname = path.dirname(tfile);
            fs.mkdirSync(dirname, {recursive: true});
            fs.writeFileSync(tfile, tempString);
            found = {bin: tfile, args: isAction.args, temp: true};
        }
    }
    return found;
};
const _findCommand = (args, localBin) => {
    let bin = 0;
    let i = 0;
    let testString = localBin;
    while (!bin && i < args.length) {
        testString += "/" + args[i];
        i++;
        if (existsDir(testString)) {
        } else if (exists(testString)) {
            bin = testString;
        } else if (exists(testString + '.js')) {
            bin = testString + '.js';
        } else if (exists(testString + '.ts')) {
            bin = testString + '.ts';
        } else if (exists(testString + '/index.js')) {
            bin = testString + '/index.js';
        }
    }
    return {bin: bin, args: args.slice(i)};
};

const runCommand = (found, args) => {
    if (found.bin) {
        let proc;
        args.unshift(found.bin);
        proc = spawn(process.execPath, args, {stdio: 'inherit'});

        let signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
        signals.forEach((signal) => {
            process.on(signal, () => {
                if (proc.killed === false && proc.exitCode === null) {
                    proc.kill(signal);
                }
            });
        });
        proc.on('close', (err) => {
            if (found.temp) {
                // fs.unlinkSync(found.bin);
            }
            process.exit.bind(process)
        });
        proc.on('error', (err) => {
            if (err.code === 'ENOENT') {
                console.error('error: %s(1) does not exist, try -commands', bin);
            } else if (err.code === 'EACCES') {
                console.error('error: %s(1) not executable. try chmod or run with root', bin);
            }
            process.exit(1);
        });

        // Store the reference to the child process
        this.runningCommand = proc;
    }
};
const runAction = async (action, args) => {
    let url = `${global.ailtire.config.host}${action.name}`;
    let argMap = {};
    for(let i=0;i<args.length;i++) {
        if(args[i].includes('-')) {
            key = args[i].replace(/\-/g,'');
            if(!args[i+1].includes('-')) {
                argMap[key] = args[++i];
            } else  {
                argMap[key] = true;
            }
        } else {
            console.error("Do not understand:", args[i]);
        }
    }
    let data = {}
    for(let aname in argMap) {
        if(action.inputs && action.inputs[aname]) {
            let typeAllCAPS = action.inputs[aname].type.toUpperCase();
            if(typeAllCAPS === 'YAML') {
                data[aname] = YAML.load(argMap[aname]);
            } else if(typeAllCAPS === 'FILE') {}
                data[aname] = fs.readfileSync(argMap[aname]);
        } else {
               data[aname] = argMap[aname];
        }
    }
    let failed = false;
    for(let iname in action.inputs) {
        if(action.inputs[iname].required) {
            if(!data[iname]) {
                console.error(`   --${iname} is required!`);
                failed = true;
            }
        }
    }
    if(failed) {
        let errorString = `Command: ${action.name.replace(/\//g,' ')}\n`;
        for(let iname in action.inputs) {
            errorString += ` --${iname} <${action.inputs[iname].type}> - ${action.inputs[iname].description}\n`;
        }
        console.error(errorString);
        console.error("Command Failed!");
    } else {
        try {
            let retVal = await axios.post(url, data);
            console.log(retVal.data);
        } catch(e) {
            console.error(e);
            throw e;
        }
    }
}
const helpGroupAction = (found) => {
    let errorString = `Usage: ${found._path.replace(/\//g,' ')} [commands]\nCommands:\n`;
    for(let iname in found) {
        if(iname !== '_path' && iname !== '_action') {
            let parameters = "";
            let inputs = found[iname]._action.inputs;
            for(let pname in inputs) {
                parameters += `--pname <${inputs[pname].type}> `
            }
            errorString += `\t${iname} ${parameters}\n\t\t${found[iname]._action.description}\n`;
        }
    }
    console.log(errorString);
}
const helpAction = (action) => {
    let errorString = `Usage: ${action.name.replace(/\//g,' ')}\n`;
    for(let iname in action.inputs) {
        errorString += `\t--${iname} <${action.inputs[iname].type}> - ${action.inputs[iname].description}\n`;
    }
    console.log(errorString);
}
const findAction = (args, localBin) => {
    let found = _findAction(args, localBin);

    if(!found._action) {
        helpGroupAction(found);
        process.exit(0);
    }
    return found;
};

const _findAction = (commandStr, localBin) => {
    const args = commandStr.split('/');
    if (!global.hasOwnProperty('ailtire')) {
        return {_action: null, args: args};
    }

    let action = 0;
    let i = 0;
    let aMap = actionMap();
    let found = true;
    let pathString = "";
    let aIter = aMap;
    while (found && i < args.length) {
        if (!aIter.hasOwnProperty(args[i])) {
            found = false;
        } else {
            pathString += '/' + args[i];
            action = aIter[args[i]];
            action._path = pathString;
            aIter = aIter[args[i]];
        }
        i++;
    }
    return aIter;
};
const _findHelpAction = (args, localBin) => {
    let action = 0;
    let i = 0;
    let testString = '';
    if (!global.hasOwnProperty('ailtire')) {
        return {action: null, args: args};
    }
    let actions = {};
    for (let path in global.ailtire.config.actions) {
        let cmds = path.split('/');
        let act = actions;
        cmds.shift();
        let pathString = '';
        for (let i in cmds) {
            pathString += '/' + cmds[i];
            if (!act.hasOwnProperty(cmds[i])) {
                act[cmds[i]] = {_path: pathString};
            }
            act = act[cmds[i]];
        }
        act.action = global.ailtire.config.actions[path];
    }
    let act = actions;
    for (let i in args) {
        if (act.hasOwnProperty(args[i])) {
            act = act[args[i]];
        }
    }
    return {action: act};
};
const _helpCommand = (found) => {
    if (found.action) {
        // Look for the bin in the interface definitions.
        let tdir = './.tmp/';
        let tfile = tdir + found.action.name.split('/').pop();

        let tempString = '#!/usr/bin/env node\n\nconst program = require(\'commander\');\n\n';
        let action = found.action;
        for (let name in action) {
            if (name !== '_path') {
                let desc = "Command with sub commands";
                let options = "[cmds]";
                if (action[name].hasOwnProperty('action')) {
                    if (action[name].action.hasOwnProperty('description')) {
                        desc = action[name].action.description;
                    }
                    tempString += `program.command('${name} [options]', '${desc}');\n`;
                } else {
                    tempString += `program.command('${name} ${options}', '${desc}');\n`;
                }
            }
        }
        tempString += '\n';
        tempString += 'program.parse(process.argv);\n';
        tfile = path.resolve(tfile);
        let dirname = path.dirname(tfile);
        fs.mkdirSync(dirname, {recursive: true});
        fs.writeFileSync(tfile, tempString);
        found = {bin: tfile, args: ['help'], temp: true};
    }
    return found;
};

const _helpCommandGroup = (found, baseDir) => {
    let interfaceDir = path.resolve(baseDir + "/../src/interface");
    let testDir = interfaceDir + '/' + found.args[0];
    let tdir = './.tmp/';
    let tfile = tdir + found.args[0] + '.js';

    let tempString = '#!/usr/bin/env node\n\nconst program = require(\'commander\');\n\n';

    if (existsDir(testDir)) {
        // Find all of the .js files that have the commands for this
        let files = getFiles(testDir);
        for (let i in files) {
            let cmd = require(files[i]);
            let name = cmd.friendlyName;
            let options = "";
            for (let j in cmd.inputs) {
                if (cmd.inputs[j].required) {
                    options += ` <--${j}=${cmd.inputs[j].type}>`;
                } else {
                    options += ` [--${j}=${cmd.inputs[j].type}]`;
                }
            }
            let desc = cmd.description;
            tempString += `program.command('${name}${options}', '${desc}');\n`;
        }
    }
    tempString += '\n';
    tempString += 'program.parse(process.argv);\n';
    tfile = path.resolve(tfile);
    let dirname = path.dirname(tfile);
    fs.mkdirSync(dirname, {recursive: true});
    try {
        fs.writeFileSync(tfile, tempString);
    } catch (e) {
        console.error("Makefile Error", e);
    }
    found = {bin: tfile, args: ['help'], temp: true};
    return found;
}

const actionMap = () => {
    let actions = {};
    for (let path in global.ailtire.config.actions) {
        let cmds = path.split('/');
        let act = actions;
        cmds.shift();
        let pathString = '';
        for (let i in cmds) {
            pathString += '/' + cmds[i];
            if (!act.hasOwnProperty(cmds[i])) {
                act[cmds[i]] = {_path: pathString};
            }
            act = act[cmds[i]];
        }
        act._action = global.ailtire.config.actions[path];
    }
    return actions;
}
