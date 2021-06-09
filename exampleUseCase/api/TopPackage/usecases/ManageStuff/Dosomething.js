module.exports = {
    name: 'Do something',
    description: 'Do something is the description',
    method: "data/source/name",
    actors: {
        'Actor': 'uses',
    },
    steps: [
        {action:'mymodel/create', parameters: { name: 'name1'}},
        {action:'mymodel/create', parameters: { name: 'name2'}},
        {action:'mymodel/create', parameters: { name: 'name3'}},
        {action:'mypkg/mymodel/list'},
    ]
};
