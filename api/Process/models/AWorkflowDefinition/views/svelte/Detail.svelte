<script>
    export let workflow = null;
</script>
{#if workflow}<section><h2>{workflow.name || 'Unnamed workflow'}</h2><p>{workflow.description || 'No description.'}</p><dl><div><dt>Version</dt><dd>{workflow.version || '—'}</dd></div><div><dt>State</dt><dd>{workflow.state || (workflow.enabled === false ? 'Disabled' : 'Enabled')}</dd></div></dl><h3>Inputs</h3><pre>{JSON.stringify(workflow.inputs || {}, null, 2)}</pre><h3>Outputs</h3><pre>{JSON.stringify(workflow.outputs || {}, null, 2)}</pre></section>{:else}<p>Select a workflow definition.</p>{/if}
