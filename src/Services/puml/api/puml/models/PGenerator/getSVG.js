const plantuml = require('node-plantuml');
const streamBuffers = require('stream-buffers');

module.exports = {
    friendlyName: 'list',
    description: 'Get the results for the system.',
    static: true,
    inputs: {
        puml: {
            type: 'string',
            required: true
        }
    },
    exits: {
        json: (obj) => {
            return obj;
        },
        success: (obj) => {
            return obj;
        },
    },


    fn: async function (obj, inputs, env) {
        return new Promise((resolve) => {
            let buffer = new streamBuffers.WritableStreamBuffer();

            let gen = plantuml.generate({format: 'svg'});
            gen.out.pipe(buffer);
            gen.in.end(inputs.puml);

            gen.out.on('finish', () => {
                let svgString = buffer.getContentsAsString('utf8');
                resolve(svgString);
            });
            gen.out.on('error', (err) => {
                console.log(err);
            });
        });
    }
};
