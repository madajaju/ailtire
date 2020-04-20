/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data Sources',
    description: 'Manage Data Sources',
    method: 'data/sources',
    actors: {
        'Data Engineer': 'uses'
    },
};

