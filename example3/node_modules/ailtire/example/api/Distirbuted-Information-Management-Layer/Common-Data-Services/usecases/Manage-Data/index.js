/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data',
    description: 'Manage Data',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Data Scientist': 'uses',
        'Data Analyst': 'uses',
        'Data Engineer': 'uses',
    },
};

