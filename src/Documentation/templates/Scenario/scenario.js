module.exports = {
    name: '<%= name %>',
    description: '<%= name %> is the description',
    given: "given statement",
    when: "when statement",
    then: "then statement",
    actors: {
        'Actor': 'uses',
    },
    steps: [
        { action: 'data/list', parameters: {name:'hello', file:'./templates/world.yml'}},
        { action: 'data/list', parameters: {name:'hello', file:'./templates/world.yml'}},
    ]
};

