const fs = require('fs');
const path = require('path');

module.exports = {
    friendlyName: 'AWorkflowExecution/respond',
    description: 'Submit a human response and release the waiting workflow step.',
    static: true,
    inputs: {
        requestId: {type: 'string', required: true},
        values: {type: 'json', required: true},
        responder: {type: 'string'}
    },
    outputs: {response: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const request = AHumanRequest.find(inputs.requestId);
        if (!request) throw new Error(`Human request not found: ${inputs.requestId}`);
        if (request._state !== 'Open') throw new Error(`Human request is not open: ${inputs.requestId}`);
        const response = new AHumanResponse({id: `${inputs.requestId}:response`});
        response.values = inputs.values;
        response.responder = inputs.responder;
        response.respondedAt = new Date().toISOString();
        response.request = request;
        request.response = response;
        request.respondedAt = response.respondedAt;
        request._state = 'Completed';
        const step = request.step;
        if (step) {
            step.outputs = {...(step.outputs || {}), human: inputs.values};
            step._state = 'Ready';
            await step.save();
        }
        const workflow = request.workflow;
        if (workflow) {
            workflow._state = 'Running';
            await workflow.save();
            if (workflow.executeReady) await workflow.executeReady();
        }
        await response.save();
        await request.save();
        if (request.baseDir) {
            fs.writeFileSync(path.join(request.baseDir, 'response.json'), JSON.stringify({
                requestId: request.id,
                values: inputs.values,
                responder: inputs.responder,
                respondedAt: response.respondedAt,
                state: 'Completed'
            }, null, 2));
            fs.writeFileSync(path.join(request.baseDir, 'task.json'), JSON.stringify({
                id: request.id,
                prompt: request.prompt,
                form: request.form,
                assignee: request.assignee,
                requestedAt: request.requestedAt,
                respondedAt: request.respondedAt,
                workflowExecutionId: workflow?.id,
                step: step?.name,
                state: 'Completed'
            }, null, 2));
        }
        if (typeof global.ailtire?.workflowStateWriter === 'function' && workflow) {
            await global.ailtire.workflowStateWriter(workflow);
        }
        return {response: {...(response._attributes || {}), id: response.id}};
    }
};
