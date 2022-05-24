const {execSync} = require("child_process");
const Build = require('../../src/Services/Build');
const deploy = require("./deploy/deploy");

describe('Microservice', () => {
    describe('Microservice Basic', () => {
        it('The single-tiered microserver works', (done) => {
            try {
                let deploy = require('./deploy/deploy.js');
                deploy.envs = deploy.contexts;
                deploy.envs.local.design = require('./deploy/' + deploy.contexts.local.design);
                Build.pkg({deploy:deploy, name:"test1"}, {env:'local', name:'testB'});
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        }).timeout(20000);
        it('The two-tiered microserver works', (done) => {
            try {
                let deploy = require('./deploy2/deploy.js');
                deploy.envs = deploy.contexts;
                deploy.envs.local.design = require('./deploy2/' + deploy.contexts.local.design);
                Build.pkg({deploy:deploy, name:"test2"}, {env:'local', name:'testB'});
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        }).timeout(20000);
    });
    describe('Microservice Test 1', () => {
        it('No one can access a microservice except through the Parent', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 2', () => {
        it('Siblings communicate with each other', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 3', () => {
        it('Cousins communicate thru common ancestor', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
    describe('Microservice Test 4', () => {
        it('Service Belongs to parent network and its own if it has children', (done) => {
            try {
                return done();
            } catch (e) {
                console.error(e);
                return done(e);
            }
        });
    });
});
