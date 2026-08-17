module.exports = {
    friendlyName: 'refresh',
    description: 'Refresh the cached snapshot from the remote service.',
    inputs: {},
    fn: async function (obj) {
        const value = await obj.get();
        if (value && typeof value === 'object') {
            obj.snapshot = value._attributes || value;
            obj.snapShotDate = new Date();
        }
        return value;
    }
};
