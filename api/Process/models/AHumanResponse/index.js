class AHumanResponse {
    static definition = {
        name: 'AHumanResponse',
        description: 'A response submitted for a workflow human request.',
        attributes: {
            values: {type: 'json'},
            responder: {type: 'string'},
            respondedAt: {type: 'string'}
        },
        associations: {
            request: {type: 'AHumanRequest', cardinality: 1, owner: false, composition: false}
        }
    };
}
module.exports = AHumanResponse;
