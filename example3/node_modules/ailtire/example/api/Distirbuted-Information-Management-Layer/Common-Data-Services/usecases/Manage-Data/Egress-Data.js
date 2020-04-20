module.exports = {
    name: 'Egress Data',
    description: 'Egress Data',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Data Scientist': 'uses',
        'Data Analyst': 'uses',
        'Data Engineer': 'uses',
    },
};

