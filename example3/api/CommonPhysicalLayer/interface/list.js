const path = require('path');
const AEvent = require('ailtire/src/Server/AEvent');
const Service = require('ailtire/src/Server/Service');

module.exports = {
    friendlyName: 'list',
    description: 'list stuff',
    static: true,
    inputs: {
        name: {
            description: 'Name of the list',
            type: 'string',
            required: false
        },
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (inputs, env) {
        let val = await Service.call('sdi.sds.list', {name: 'Darren'});
        AEvent.emit("cpl.list", {name: "CPL Darren Called"});
        AEvent.emit("sds.list", {name: "SDS Darren Called"});

        if (env) {
            env.res.end("<html><script src='/socket.io/socket.io.js'></script>" +
                "<script>const socket = io('http://localhost'); socket.emit('sds.list');" +
                "socket.on('cpl.list', (data) => {" +
                "console.log('Data', data); });</script>" +
                "<h1>CPL LIST</h1>" +
                "<button onclick='socket.emit(\"sds.list\");'>Send Event</button>" +
                "</html>");
        } else {
            console.log("CPL List Done");
            return "CPL List Done";
        }
    }
};



