class AWorkflowExecution {
    static definition = {
        name: 'AWorkflowExecution',
        description: 'Durable execution of an immutable workflow definition version.',
        attributes: {
            workflowVersion: {type: 'string', required: true},
            correlationId: {type: 'string'},
            causationId: {type: 'string'},
            rootRunId: {type: 'string'},
            inputs: {type: 'json'},
            outputs: {type: 'json'},
            context: {type: 'json'},
            events: {type: 'json', description: 'Events received by this workflow execution, keyed by event type'}
            ,history: {type: 'json', description: 'Recorded planner decisions and activity results'}
        },
        associations: {
            definition: {type: 'AWorkflowDefinition', cardinality: 1, owner: false, composition: false},
            parent: {type: 'AWorkflowExecution', cardinality: 1, owner: false, composition: false},
            steps: {type: 'AStepExecution', cardinality: 'n', owner: true, composition: true, via: 'workflow'},
            subscriptions: {type: 'AEventSubscription', cardinality: 'n', owner: true, composition: true, via: 'workflow'}
        },
        statenet: {
            Init: {events: {start: {Running: {}}, cancel: {Cancelled: {}}}},
            Running: {events: {wait: {Waiting: {}}, pause: {Paused: {}}, complete: {Completed: {}}, fail: {Failed: {}}, cancel: {Cancelled: {}}}},
            Waiting: {events: {resume: {Running: {}}, fail: {Failed: {}}, cancel: {Cancelled: {}}}},
            Paused: {events: {resume: {Running: {}}, cancel: {Cancelled: {}}}},
            Completed: {}, Failed: {}, Cancelled: {}
        }
    };
}
module.exports = AWorkflowExecution;
