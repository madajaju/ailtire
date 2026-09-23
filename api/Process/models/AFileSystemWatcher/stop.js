module.exports = {
    friendlyName: 'stop',
    description: 'Stop watching the filesystem and release watcher resources.',
    static: true,
    inputs: {correlationId: {type: 'string'}},
    fn: function (inputs) {
        const watchers = global.__ailtireFileSystemWatchers;
        const watcher = inputs.correlationId ? watchers?.get(inputs.correlationId) : this;
        if (!watcher) return {active: false};
        if (watcher.timers) for (const timer of watcher.timers.values()) clearTimeout(timer);
        if (watcher.watcher) watcher.watcher.close();
        watcher.timers?.clear();
        watcher.active = false;
        if (inputs.correlationId) watchers.delete(inputs.correlationId);
        return {active: false};
    }
};
