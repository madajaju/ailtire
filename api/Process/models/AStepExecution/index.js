class AStepExecution {
    static definition = {
        name: 'AStepExecution',
        description: 'Durable execution state for one workflow step.',
        attributes: {
            attempt: {type: 'number'},
            inputs: {type: 'json'},
            outputs: {type: 'json'},
            error: {type: 'json'},
            childWorkflowRunId: {type: 'string'},
            runtimeInstanceId: {type: 'string'},
            waitingFor: {type: 'json', description: 'Internal completion events required before this step can run'},
            lifecycleState: {type: 'string', description: 'Runtime lifecycle state for long-running steps'},
            startedAt: {type: 'string'},
            completedAt: {type: 'string'}
        },
        associations: {
            workflow: {type: 'AWorkflowExecution', cardinality: 1, owner: false, composition: false},
            stepDefinition: {type: 'AActivity', cardinality: 1, owner: false, composition: false},
            AHumanRequest: {type: 'AHumanRequest', cardinality: 1, owner: true, composition: true, via: 'step'}
        },
        statenet: {
            Init: {events: {prepare: {Pending: {}}}},
            Pending: {events: {ready: {Ready: {}}, skip: {Skipped: {}}, cancel: {Cancelled: {}}}},
            Ready: {events: {execute: {Running: {}}, wait: {Waiting: {}}, skip: {Skipped: {}}, cancel: {Cancelled: {}}}},
            Running: {events: {complete: {Completed: {}}, wait: {Waiting: {}}, fail: {Failed: {}}, cancel: {Cancelled: {}}}},
            Waiting: {events: {resume: {Ready: {}}, fail: {Failed: {}}, cancel: {Cancelled: {}}}},
            Failed: {events: {retry: {Ready: {}}}}, Completed: {}, Skipped: {}, Cancelled: {}
        }
    };
}
module.exports = AStepExecution;
