const fs = require('fs');
const path = require('path');
const AEvent = require('../../../../src/Server/AEvent');

module.exports = {
    friendlyName: 'start',
    description: 'Start watching a directory and emit normalized filesystem events.',
    inputs: {
        directory: {type: 'string', required: true},
        patterns: {type: 'json'},
        recursive: {type: 'boolean'},
        debounceMs: {type: 'number'},
        correlationId: {type: 'string'}
    },
    fn: function (inputs) {
        if (!fs.existsSync(inputs.directory)) throw new Error(`Directory not found: ${inputs.directory}`);
        const patterns = inputs.patterns || [];
        const debounceMs = inputs.debounceMs || 250;
        const timers = new Map();
        const matches = file => !patterns.length || patterns.some(pattern => {
            const suffix = String(pattern).replace(/^\*/, '');
            return file.endsWith(suffix);
        });
        const watcher = fs.watch(inputs.directory, {recursive: Boolean(inputs.recursive)}, (eventType, filename) => {
            if (!filename) return;
            const file = path.resolve(inputs.directory, filename.toString());
            if (!matches(file)) return;
            clearTimeout(timers.get(file));
            timers.set(file, setTimeout(() => {
                timers.delete(file);
                AEvent.emit(`filesystem.${eventType}`, {
                    type: `filesystem.${eventType}`,
                    correlationId: inputs.correlationId,
                    payload: {path: file, eventType}
                });
            }, debounceMs));
        });
        this.active = true;
        this.watcher = watcher;
        this.timers = timers;
        global.__ailtireFileSystemWatchers = global.__ailtireFileSystemWatchers || new Map();
        if (inputs.correlationId) global.__ailtireFileSystemWatchers.set(inputs.correlationId, this);
        return {active: true, directory: inputs.directory};
    }
};
