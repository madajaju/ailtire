const execSync = require('child_process').execSync;

describe(' SDI Test Cases', () => {
    describe('Cloud create and build out', () => {
        let commands = [
            'bin/edgemere Device create --name host1 --file ./templates/device.yaml',
            'bin/edgemere DataCenter create --name dc1',
            'bin/edgemere Device create --name host2 --file ./templates/device.yaml',
            'bin/edgemere Device create --name host3 --file ./templates/device.yaml',
            'bin/edgemere Device create --name host4 --file ./templates/device.yaml',
            'bin/edgemere Device create --name host5 --file ./templates/device.yaml',
            'bin/edgemere Device create --name host6 --file ./templates/device.yaml',
            'bin/edgemere DataCenter addDevices --name dc1 --items host1,host2,host3,host4,host5,host6',
            'bin/edgemere Cloud create --name cloud1',
            'bin/edgemere Cloud addDatacenters --name cloud1 --items dc1'
        ];
        for (let i in commands) {
            let command = 'bash -c "' + commands[i] + '"';
            it('Run Command ' + command, (done) => {
                try {
                    let results = execSync(command);
                    console.log(results.toString());
                    return done();
                }
                catch (e) {
                    console.error(e);
                    return done(e);
                }
            });
        }

    });
    describe('Cloud create and build out getResource', () => {
        let commands = [
            'bin/edgemere Device create --name host1 --file ./templates/device.yaml',
            'bin/edgemere Cloud create --name cloud2',
            'bin/edgemere Cloud addDevices --name cloud2 --items host1',
            'bin/edgemere sdi getresources --name myRes --cloud cloud2 --requirements ./templates/requirements.yaml',
        ];
        for (let i in commands) {
            let command = 'bash -c "' + commands[i] + '"';
            it('Run Command ' + command, (done) => {
                try {
                    let results = execSync(command);
                    console.log(results.toString());
                    return done();
                }
                catch (e) {
                    console.error(e);
                    return done(e);
                }
            });
        }
    });
    describe('Cloud create and build out getResource', () => {
        let commands = [
            'bin/edgemere sdi getresources --name myRes2 --cloud cloud1 --requirements ./templates/requirements.yaml',
        ];
        for (let i in commands) {
            let command = 'bash -c "' + commands[i] + '"';
            it('Run Command ' + command, (done) => {
                try {
                    let results = execSync(command);
                    console.log(results.toString());
                    return done();
                }
                catch (e) {
                    console.error(e);
                    return done(e);
                }
            });
        }
    });
});
