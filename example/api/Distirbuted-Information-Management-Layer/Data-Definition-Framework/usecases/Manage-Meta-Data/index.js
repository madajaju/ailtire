/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Meta Data',
    description: 'Manage Meta Data',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Data Scientist': 'uses',
    },
};

