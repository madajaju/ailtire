const {Command} = require('commander');
const BuildServices = require('./src/Services/BuildEngine');
const project = require('./package.json');
const program = new Command();
const YAML = require('yamljs');
const fs = require('fs');

program
    .name('build')
    .description('Build the ailtire project')
    .version(project.version); // Sets the version of the CLI tool

// Option to display the current version
program
    .command('version <number>')
    .description('Set the version of ailtire')
    .action((version) => {
        BuildServices.services('./src/Services', {version: version});
        // Update the doc directory.

    });

// Option to bump the version with a specified type (major, minor, patch)
program
    .command('bump <type>')
    .description('Bump the version (major, minor, or patch)')
    .action((type) => {
        // You would typically update your package version here, e.g., in package.json
        console.log(`Bumping version: ${type}`);
        if(!type) {
            console.error('Error: you must specify a version type (major, minor, or patch)');
        }
        let version = BuildServices.bumpVersion('.', type);
        // Example of invoking a service for build or version modifications
        BuildServices.setVersion('.', version);
        BuildServices.services('./src/Services', {version: version});
        // Update the doc directory.
        _updateDocDirectory(version);
    });

// Parse command-line arguments
program.parse(process.argv);

function _updateDocDirectory(version) {
    let doc = YAML.load('./docs/_config.yml');
    doc.version = version;
    doc.title = 'ailtire Framework v' + version;
    const yamlstring = YAML.stringify(doc);
    fs.writeFileSync('./docs/_config.yml', yamlstring);
}