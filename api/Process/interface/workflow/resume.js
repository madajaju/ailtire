const action = require('../workflowExecution/control');
module.exports = {...action, friendlyName: 'workflow/resume', inputs: {id: action.inputs.id}, fn: inputs => action.fn({...inputs, action: 'resume'})};
