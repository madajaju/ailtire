/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data Policies',
    description: 'Manage Data Policies',
    method: 'data/policies', // if it is not specified then the default should be used.
    actors: {
        'Chief Data Officer': 'uses'
    },
};

