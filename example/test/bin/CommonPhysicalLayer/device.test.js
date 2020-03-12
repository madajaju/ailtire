const execSync = require('child_process').execSync;

describe(' SDI Test Cases', () => {
    describe('Cloud create and build out', () => {
        let commands = [
            'bin/edgemere Device create --name host1 --file ./templates/device.yaml',
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
    describe('Cloud create and build out', () => {
        let commands = [
            'bin/edgemere Device create --name host1 --file ./templates/device.yaml',
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
    describe('Create Device and get reservation', () => {
        let commands = [
            'bin/edgemere Device create --name host1 --file ./templates/device.yaml',
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
