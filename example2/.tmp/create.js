#!/usr/bin/env node

const program = require('commander');

const action = require('C:\\Users\\darre\\work\\ailtire\\src\\interface\\app\\create.js');
const ActionHandler = require('C:\\Users\\darre\\work\\ailtire\\src\\Server/Action.js');
global.ailtire = { config: require('C:\\Users\\darre\\work\\ailtire\\bin\\lib/../../.ailtire.js') };
program
	.storeOptionsAsProperties(false)
	.passCommandToAction(false);
program
	.requiredOption('--name <string>', 'The name of the application')
	.option('--path <string>', 'The path to install the application');
program.parse(process.argv);
let results = ActionHandler.execute(action,program.opts(), {});
console.log(results);
