class WorkflowEventCoordinator {
    static definition = {
        name: 'WorkflowEventCoordinator',
        description: 'Correlates incoming events with a workflow execution and evaluates activity triggers.',
        attributes: {
            events: {
                type: 'json',
                description: 'Events received by the workflow, grouped by event type'
            }
        },
        associations: {
            workflow: {
                type: 'AWorkflowExecution',
                cardinality: 1,
                owner: false,
                composition: false
            }
        }
    };

}

module.exports = WorkflowEventCoordinator;
