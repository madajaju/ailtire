const AEvent = require('../../src/Server/AEvent');
const fs = require('fs');

let _activityInstances = {};

module.exports = {
    show: (activity) => {
        return _activityInstances[activity.name][activity.id];
    },
    toJSON: (activity) => {
        return _toJSON(activity);
    },
    save: (activity) => {
        return _save(activity);
    },
};

function _itemToString(item) {
    
    let retval = '{';
    for(const [key, value] of Object.entries(item)) {
        if(typeof value === 'function') {
            retval += `"${key}": ${value.toString()},\n`;
        } else if(typeof value === 'object') {
            retval += `'${key}': ${_itemToString(value)},\n`;
        } else {
            retval += `"${key}": "${value}",\n`;
        }
    }
    retval += '}';
    return retval;
}

// This will return a string to be used by the workflow for saving.
function _save(activity) {
    return `${_itemToString(activity)}`;
}

function _toJSON(activity) {
    let retval = {};
    for (let aname in activity) {
        let item = activity[aname];
        if (typeof item !== "object") {
            retval[aname] = item;
        } else if (aname === 'inputs') {
            retval[aname] = activity.inputs;
        } else if (aname === 'outputs') {
            retval[aname] = activity.outputs;
        } else if (aname === 'next') {
            if (!retval.next) {
                retval.next = {};
            }
            for (let nname in activity[aname]) {
                retval[aname][nname] = activity[aname][nname].id || activity[aname][nname].name || 1;
            }
        } else if (aname === 'parent') {
            retval.parent = activity.parent.id;
        } else if (aname === 'previous') {
            retval.previous = [];
            for(let i in activity.previous) {
                if(activity.previous[i]) {
                    retval.previous.push({id: activity.previous[i].id, name: activity.previous[i].name})
                }
            }
        }
    }
    return retval;
}
