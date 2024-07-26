const fs = require("fs");
const  _userActivityInstances = {};
class UserActivity {
    constructor(opts) {
        const AEvent = require('./AEvent');
        this.activity = opts.activity;
        this.actor = opts.actor;
        this.id = opts.activity.id;
        _userActivityInstances[this.id] = this;
        _saveInstance(this,this.parent);
        AEvent.emit("useractivity.created", {obj: this.toJSON()});
    }
    static getInstance(id) {
        return _userActivityInstances[id];
    }
    static instances() {
        return _userActivityInstances;
    }
    complete(inputs) {
        const AEvent = require('./AEvent');
        this.activity.inputs = inputs;
        let outputs = {};
        for (let oname in this.activity.activity.outputs) {
            outputs[oname] = this.activity.activity.outputs[oname].fn(this.activity);
        }
        this.activity.outputs = outputs;
        this.state = "Completed";
        _saveInstance(this,this.parent);
        AEvent.emit("activity.completed", {obj: this.toJSON()});
        AEvent.emit("useractivity.completed", {obj: this.toJSON()});
    }
    toJSON() {
        return {
            id:this.id,
            actor: this.actor,
            name: this.activity.name,
            state: this.activity.state,
            inputs:this.activity.inputs,
            outputs: this.activity.outputs,
            activity: {
                inputs: this.activity.activity.inputs,
                outputs: this.activity.activity.outputs,
            },
            description: this.activity.activity.description
        };
    }
}
function _saveInstance(obj, parent) {
    let dir = obj.baseDir || `${parent?.baseDir}/activity-${obj.id}`;
    obj.baseDir = dir;
    let tempObj = obj.toJSON();
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true});
    }
    let wfile = `${dir}/index.js`;
    let outputString = `module.exports = ${JSON.stringify(tempObj)};\n`;
    fs.writeFileSync(wfile, outputString);
    return;
}
module.exports=UserActivity;