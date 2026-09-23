<script>
    import List from './List.svelte';
    import Detail from './Detail.svelte';
    import Form from './Form.svelte';
    let selected = null, started = null, showForm = false;
</script>
<div class="browser"><aside><button disabled={!selected} on:click={() => {showForm = true; started = null}}>Launch selected workflow</button><List on:select={event => {selected = event.detail; started = null; showForm = false}} /></aside><section>{#if showForm}<Form workflow={selected} on:started={event => {started = event.detail; showForm = false}} />{:else if started}<h2>Workflow started</h2><pre>{JSON.stringify(started, null, 2)}</pre>{:else}<Detail workflow={selected} />{/if}</section></div>
<style>.browser{display:grid;grid-template-columns:320px minmax(0,1fr);gap:18px}.browser>aside,.browser>section{background:#fff;border:1px solid #d7dce3;border-radius:8px;padding:18px}ul{list-style:none;padding:0}li+li{margin-top:7px}li button{display:grid;text-align:left;width:100%;gap:4px}small,span{color:#697586}button{padding:8px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:5px;cursor:pointer}button:disabled{opacity:.5}pre{white-space:pre-wrap}@media(max-width:800px){.browser{grid-template-columns:1fr}}</style>
