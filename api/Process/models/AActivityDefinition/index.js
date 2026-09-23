class AActivityDefinition {
    static definition = {
        name: 'AActivityDefinition',
        description: 'Metadata describing an activity that can satisfy workflow steps.',
        unique: obj => obj.name,
        attributes: {
            name: {type: 'string', required: true},
            ref: {type: 'string', required: true},
            description: {type: 'string'},
            inputs: {type: 'json'},
            outputs: {type: 'json'},
            capabilities: {type: 'json'},
            appliesTo: {type: 'json'},
            enabled: {type: 'boolean'}
        }
    };
}
module.exports = AActivityDefinition;
