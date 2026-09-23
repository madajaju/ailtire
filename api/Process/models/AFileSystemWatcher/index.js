class AFileSystemWatcher {
    static definition = {
        name: 'AFileSystemWatcher',
        description: 'Persistent activity that converts filesystem changes into workflow events.',
        attributes: {
            directory: {type: 'string', required: true},
            recursive: {type: 'boolean'},
            patterns: {type: 'json'},
            debounceMs: {type: 'number'},
            active: {type: 'boolean'}
        },
        associations: {
            workflow: {type: 'AWorkflowExecution', cardinality: 1, owner: false, composition: false}
        }
    };
}

module.exports = AFileSystemWatcher;
