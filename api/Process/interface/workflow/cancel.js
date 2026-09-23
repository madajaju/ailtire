const action = require('../workflowExecution/control');
module.exports = {...action, friendlyName: 'workflow/cancel', inputs: {id: action.inputs.id}, fn: inputs => action.fn({...inputs, action: 'cancel'})};
