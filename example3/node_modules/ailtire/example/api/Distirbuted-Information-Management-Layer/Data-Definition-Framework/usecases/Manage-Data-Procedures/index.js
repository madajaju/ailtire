/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data Procedures',
    description: 'Manage Data Procedures',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Chief Data Officer': 'uses',
        'Data Engineer': 'uses',
    },
};

