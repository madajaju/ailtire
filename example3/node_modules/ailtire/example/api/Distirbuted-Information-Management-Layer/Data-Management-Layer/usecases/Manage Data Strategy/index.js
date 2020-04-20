/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data Strategy',
    description: 'Manage Data Strategy',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Chief Data Officer': 'uses'
    },
};

