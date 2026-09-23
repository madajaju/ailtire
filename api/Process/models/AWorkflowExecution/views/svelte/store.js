import {writable} from 'svelte/store';
export const store = writable({items: [], loading: false, error: null});
async function request(url, options = {}) { const response = await fetch(url, {headers: {'Content-Type': 'application/json'}, ...options}); const body = await response.json().catch(() => ({})); if (!response.ok) throw Error(body.error || `Request failed: ${response.status}`); return body; }
export async function list(state = '') { store.update(v => ({...v, loading: true, error: null})); try { const body = await request(`/ailtire/workflowExecution/list${state ? `?state=${encodeURIComponent(state)}` : ''}`); const items = body.executions || []; store.set({items, loading: false, error: null}); return items; } catch (error) { store.update(v => ({...v, loading: false, error: error.message})); throw error; } }
export async function progress(id) { return (await request(`/ailtire/workflow/progress?id=${encodeURIComponent(id)}`)).progress; }
export async function control(id, action) { return request('/ailtire/workflow/control', {method: 'POST', body: JSON.stringify({id, action})}); }
export async function start(data) { return (await request('/ailtire/workflow/start', {method: 'POST', body: JSON.stringify({...data, inputs: JSON.parse(data.inputs || '{}')})})).execution; }
export async function grouped() {
    const [workflowBody, executionItems] = await Promise.all([request('/ailtire/workflow/list'), list()]);
    const workflows = [];
    const flatten = groups => (groups || []).forEach(group => { (group.workflows || []).forEach(workflow => workflows.push(workflow)); flatten(group.categories); });
    flatten(workflowBody.categories);
    const byKey = new Map(workflows.map(workflow => [`${workflow.name}:${workflow.version || '1'}`, {...workflow, executions: []}]));
    executionItems.forEach(execution => { const name = execution.workflowName || execution.name || String(execution.id || '').split(':')[0] || 'Unknown workflow'; const version = execution.workflowVersion || String(execution.id || '').split(':')[1] || '1'; const key = `${name}:${version}`; const group = byKey.get(key) || {name, version, inputs: {}, outputs: {}, executions: []}; group.executions.push(execution); if (!byKey.has(key)) byKey.set(key, group); });
    return [...byKey.values()];
}
