module.exports = {
    friendlyName: 'progress', description: 'Return execution progress.', inputs: {}, fn: function () {
        const steps = Object.values(this.steps || {}).map(step => ({
            id: step.id,
            name: step.name || step._attributes?.name,
            state: step._state,
            attempt: step.attempt || 1,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            error: step.error,
            childWorkflowRunId: step.childWorkflowRunId
        }));
        const completed = steps.filter(step => ['Completed', 'Skipped'].includes(step.state)).length;
        return {
            id: this.id,
            state: this._state,
            total: steps.length,
            completed,
            percent: steps.length ? Math.round((completed / steps.length) * 100) : 0,
            steps
        };
    }
};
