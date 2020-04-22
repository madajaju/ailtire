module.exports = {
    name: 'sds.list',
    handlers: [
        {
            fn: function (data) {
                console.log("Made it here: SDS.list");
            },
        },
        {
            action: 'cpl/list'
        },
    ]
};



