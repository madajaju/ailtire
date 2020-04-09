module.exports = {
    name: 'resource.provision',
    handlers: [
        {
            fn: function (data) {
                console.log("Made it here");
            },
        },
        {
            action: 'cpl/provision'
        },
    ]
};



