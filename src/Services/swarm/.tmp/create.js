#!/usr/bin/env node

const program = require('commander');

const action = require('C:\\Users\\dwpulsip\\AppData\\Roaming\\npm\\node_modules\\ailtire\\src\\interface\\app\\create.js');
const ActionHandler = require('C:\\Users\\dwpulsip\\AppData\\Roaming\\npm\\node_modules\\ailtire\\src\\Server/Action.js');
global.ailtire = { config: require('C:\\Users\\dwpulsip\\AppData\\Roaming\\npm\\node_modules\\ailtire\\bin\\lib/../../.ailtire.js') };
program
	.storeOptionsAsProperties(false)
	.passCommandToAction(false);
program
	.requiredOption('--name <string>', 'The name of the application')
	.option('--path <string>', 'The path to install the application');
program.parse(process.argv);
let results = ActionHandler.execute(action,program.opts(), {});
console.log(results);
