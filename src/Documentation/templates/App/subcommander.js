/**
 * Module dependencies.
 */

const spawn = require('child_process').spawn;
const path = require('path');
const dirname = path.dirname;
const basename = path.basename;
const fs = require('fs');
const commander = require('commander');

// Get the package.json to get the current working directory and project name.

commander.executeSubCommand = function (argv, args, unknown) {
    args = args.concat(unknown);
    if (!args.length) {
        this.help();
    }
    if (args[0] === 'help' && args.length === 1) {
        this.help();
    }

    // <cmd> --help
    if (args[0] === 'help') {
        args[0] = args[1];
        args[1] = '--help';
    }

    // executable
    let f = argv[1];

    // name of the subcommand, link `pm-install`
    let bin = args.join('/');

    // In case of globally installed, get the base dir where executable
    //  subcommand file should be located at
    let baseDir;


    let link = fs.lstatSync(f).isSymbolicLink() ? fs.readlinkSync(f) : f;

    // when symbolink is relative path
    if (link !== f && link.charAt(0) !== '/') {
        link = path.join(dirname(f), link);
    }
    baseDir = dirname(link);


    // prefer local `./<bin>` to bin in the $PATH
    let localBin = path.join(baseDir, bin);

    // whether bin file is a js script with explicit `.js` or `.ts` extension
    let isAction = false;
    let found = findCommand(args, baseDir);
    if (!found.bin) {
        // Look for the bin in the interface definitions.
        let interfaceDir = path.resolve(baseDir + "/../src/interface");
        let isAction = findCommand(args, interfaceDir);
        if (isAction.bin) {
            var tdir = './.tmp/bin';
            var tfile = tdir + '/' + isAction.bin.replace(interfaceDir,'');
            let tempString = '#!/usr/bin/env node\n\nconst program = require(\'commander\');\n\n';
            let actionPath = path.resolve(isAction.bin);
            actionPath =actionPath.replace(/\\/g, '\\\\');
            actionPath =actionPath.replace(/\//g, '\\\\');
            tempString += `const action = require('${actionPath}');\n`;
            let action = require(path.resolve(isAction.bin));
            tempString += `program.command('${action.friendlyName} [options]', '${action.description}')`;
            for (let iname in action.inputs) {
                let input = action.inputs[iname];
                tempString += `\n\t.option('--${iname} <${input.type}>', '${input.description}')`;
            }
            tempString += ';\n';
            tempString += 'program.parse(process.argv);\n';
            tempString += 'let results = action.fn(program);\n';
            tempString += 'console.log(results);';

            tfile = path.resolve(tfile);
            let dirname = path.dirname(tfile);
            fs.mkdirSync(dirname, {recursive: true});
            fs.writeFileSync(tfile, tempString);
            found = {bin: tfile, args: isAction.args};
        }
    }
    if (!found.bin && !isAction.bin) {
        console.error('error: "%s" does not exist, try --help', args.join(' '));
        return;
    }
    if (found.bin) {
        let proc;
        if (process.platform !== 'win32') {
            if (isExplicitJS) {
                args.unshift(bin);
                // add executable arguments to spawn
                args = (process.execArgv || []).concat(args);

                proc = spawn(process.argv[0], args, {stdio: 'inherit', customFds: [0, 1, 2]});
            } else {
                proc = spawn(bin, args, {stdio: 'inherit', customFds: [0, 1, 2]});
            }
        } else {
            args.unshift(found.bin);
            console.log(args);
            proc = spawn(process.execPath, args, {stdio: 'inherit'});
        }

        let signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
        signals.forEach((signal) => {
            process.on(signal, () => {
                if (proc.killed === false && proc.exitCode === null) {
                    proc.kill(signal);
                }
            });
        });
        proc.on('close', process.exit.bind(process));
        proc.on('error', (err) => {
            if (err.code === 'ENOENT') {
                console.error('error: %s(1) does not exist, try --help', bin);
            } else if (err.code === 'EACCES') {
                console.error('error: %s(1) not executable. try chmod or run with root', bin);
            }
            process.exit(1);
        });

        // Store the reference to the child process
        this.runningCommand = proc;
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


const findCommand = (args, localBin) => {
    let bin = 0;
    let i = 0;
    let testString = localBin;
    while (!bin && i < args.length) {
        testString += "/" + args[i]
        i++;
        if (existsDir(testString)) {
            console.log("Directory Found:", testString);
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

