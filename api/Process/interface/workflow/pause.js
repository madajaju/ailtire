const action = require('../workflowExecution/control');
module.exports = {...action, friendlyName: 'workflow/pause', inputs: {id: action.inputs.id}, fn: inputs => action.fn({...inputs, action: 'pause'})};
