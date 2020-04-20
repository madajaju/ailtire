module.exports = {
    name: 'Destroy Data',
    description: 'Destroy Data',
    method: "/edgemere/info", // if it is not specified then the default should be used.
    actors: {
        'Data Scientist': 'uses',
        'Data Analyst': 'uses',
        'Data Engineer': 'uses',
    },
};

