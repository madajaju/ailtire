module.exports = {
    name: 'Do somethinag Else',
    description: 'Do somethinag Else is the description',
    method: "data/source/name",
    actors: {
        'Actor': 'uses',
    },
    steps: [
        {action:'mymodel/create', parameters: { name: 'name1'}},
        {action:'mymodel/create', parameters: { name: 'name2'}},
        {action:'mymodel/create', parameters: { name: 'name3'}},
        {action:'mymodel/list'},
    ]
};

