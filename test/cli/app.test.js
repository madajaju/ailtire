const execSync = require('child_process').execSync;

describe('application', () => {
    describe('app create', () => {
        it('Create an application', (done) => {
            try {
                let command = `bash -c "bin/ailtire app create --name MyApp --path ./tmp/MyApp"`;
                let results = execSync(command).toString();
                console.log("Results:", results);
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
        it('Add Model', (done) => {
            try {
                let command = `bash -c "bin/ailtire model --name MyApp --path ./tmp/MyApp"`;
                let results = execSync(command).toString();
                console.log("Results:", results);
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
});
