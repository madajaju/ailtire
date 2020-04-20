/**
 * usecase.js
 *
 * @description :: This is a collection of scenarios that are mapped to nodejs machines.
 */

module.exports = {
    name: 'Manage Data Blue Prints',
    description: 'Manage Data Blue Prints',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Data Engineer': 'uses',
        'Data Scientist': 'uses',
    },
};

