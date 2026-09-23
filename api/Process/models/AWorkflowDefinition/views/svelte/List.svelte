<script>
    import {onMount, createEventDispatcher} from 'svelte';
    import {store, list} from './store.js';
    const dispatch = createEventDispatcher();
    let search = '';
    $: filtered = $store.items.filter(item => !search || [item.name, item.description, item.category].some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));
    onMount(() => list().catch(() => {}));
</script>
<section>
    <header><h2>Workflow definitions</h2><button on:click={() => list()}>Refresh</button></header>
    <input placeholder="Search workflows" bind:value={search} />
    {#if $store.loading}<p>Loading…</p>{:else if !filtered.length}<p>No workflow definitions found.</p>{:else}<ul>{#each filtered as workflow (workflow.id || workflow.name)}<li><button on:click={() => dispatch('select', workflow)}><strong>{workflow.name}</strong><small>v{workflow.version || '1'} · {workflow.category || 'Uncategorized'}</small><span>{workflow.description || 'No description.'}</span></button></li>{/each}</ul>{/if}
</section>
