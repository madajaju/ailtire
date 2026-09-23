module.exports = {
    friendlyName: 'control',
    description: 'Change the execution state.',
    inputs: {action: {type: 'string', required: true}},
    fn: async function (obj, inputs) {
        const states = {pause: 'Paused', resume: 'Running', cancel: 'Cancelled'};
        if (!states[inputs.action]) throw new Error(`Unsupported workflow action: ${inputs.action}`);
        obj._state = states[inputs.action];
        if (inputs.action === 'cancel' && global.AFileSystemWatcher?.stop) {
            global.AFileSystemWatcher.stop({correlationId: obj.correlationId});
        }
        if (inputs.action === 'resume' && obj.executeReady) {
            await obj.executeReady();
        }
        return {execution: {...(obj._attributes || {}), id: obj.id}};
    }
};
