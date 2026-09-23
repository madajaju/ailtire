<script>
    import {createEventDispatcher} from 'svelte';
    import {start} from './store.js';
    export let workflow = null;
    const dispatch = createEventDispatcher();
    let inputs = '{}', loading = false, error = '';
    async function submit() { loading = true; error = ''; try { dispatch('started', await start({workflowName: workflow.name, workflowVersion: workflow.version || '1', inputs})); } catch (e) { error = e.message; } finally { loading = false; } }
</script>
{#if workflow}<form on:submit|preventDefault={submit}><h2>Launch workflow</h2><p>{workflow.name} v{workflow.version || '1'}</p><label>Inputs JSON<textarea bind:value={inputs}></textarea></label>{#if error}<p class="error">{error}</p>{/if}<button disabled={loading}>{loading ? 'Launching…' : 'Launch workflow'}</button></form>{/if}
