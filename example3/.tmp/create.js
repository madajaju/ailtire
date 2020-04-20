#!/usr/bin/env node

const program = require('commander');

const action = require('C:\\Users\\darre\\work\\ailtire\\src\\interface\\package\\create.js');
const ActionHandler = require('C:\\Users\\darre\\work\\ailtire\\src\\Server/Action.js');
global.ailtire = { config: require('C:\\Users\\darre\\work\\ailtire\\bin\\lib/../../.ailtire.js') };
program
	.storeOptionsAsProperties(false)
	.passCommandToAction(false);
program
	.requiredOption('--name <string>', 'The name of the package. sub packages created with / as separator');
program.parse(process.argv);
let results = ActionHandler.execute(action,program.opts(), {});
console.log(results);
