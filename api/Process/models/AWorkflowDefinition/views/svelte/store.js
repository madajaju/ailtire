import {writable} from 'svelte/store';

export const store = writable({items: [], selected: null, loading: false, error: null});
const api = '/ailtire/workflow';

async function request(url, options = {}) {
    const response = await fetch(url, {headers: {'Content-Type': 'application/json'}, ...options});
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
    return body;
}

export async function list() {
    store.update(value => ({...value, loading: true, error: null}));
    try {
        const categories = (await request(`${api}/list`)).categories || [];
        const items = [];
        const flatten = (groups, parent = '') => (groups || []).forEach(group => {
            (group.workflows || []).forEach(workflow => items.push({...workflow, category: parent || group.name}));
            flatten(group.categories, parent ? `${parent} / ${group.name}` : group.name);
        });
        flatten(categories);
        store.update(value => ({...value, items, loading: false}));
        return items;
    } catch (error) {
        store.update(value => ({...value, loading: false, error: error.message}));
        throw error;
    }
}

export function start(data) {
    return request(`${api}/start`, {method: 'POST', body: JSON.stringify({...data, inputs: JSON.parse(data.inputs || '{}')})});
}

export default {store, list, start};
