const AEvent = require('./AEvent');
const  _userActivityInstances = {};
class UserActivity {
    constructor(opts) {
        this.activity = opts.activity;
        this.actor = opts.actor;
        this.id = opts.activity.id;
        _userActivityInstances[this.id] = this;
        AEvent.emit("useractivity.created", {obj: this.toJSON()});
    }
    static getInstance(id) {
        return _userActivityInstances[id];
    }
    static instances() {
        return _userActivityInstances;
    }
    complete(inputs) {
        this.activity.inputs = inputs;
        let outputs = {};
        for (let oname in this.activity.activity.outputs) {
            outputs[oname] = this.activity.activity.outputs[oname].fn(this.activity);
        }
        this.activity.outputs = outputs;
        this.state = "Completed";
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

module.exports=UserActivity;