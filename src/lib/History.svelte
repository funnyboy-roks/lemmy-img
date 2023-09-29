<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { sortsFormatted } from '../constants';
    import { history, modal } from '../stores';

    const dispatch = createEventDispatcher();

    const close = () => {
        $modal = 'none';
    };

    const goto = (query: any) => {
        dispatch('goto', query);
    }

    const remove = (index: number) => {
        $history = $history.filter((_, i) => i !== index);
    }

    const deleteAll = () => {
        if (confirm('Are you sure you want to delete your full history?')) {
            $history = [];
        }
    }

    onMount(() => {
        // @ts-ignore
        document.querySelector('#history-entry-0')?.focus();
    });

    const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }
</script>

<svelte:window on:keydown={keydown} />

<div class="history">
    <button class="close x" on:click={close}>&times;</button>
    <h1>History</h1>
    <ul>
    {#each $history as entry, i (i)}
        <li>
            <button on:click={() => goto(entry)} class="query-link" id="history-entry-{i}">{entry.query} ({sortsFormatted[entry.sort]})</button>
            <button class="delete x" on:click={() => remove(i)}>&times;</button>
        </li>
    {:else}
        Your history is empty
    {/each}
    </ul>
    <button class="delete-all x" on:click={deleteAll}>Delete All</button>
</div>

<style>
    .history {
        position: fixed;
        left: 0;
        top: 0;
        background: #222;
        min-width: 20vw;
        max-width: 100vw;
        height: 100vh;
        color: lightgrey;
        padding: 0;
        height: 100%;

        display: flex;
        flex-direction: column;

        font-size: 1.5rem;
    }

    h1 {
        padding-left: 2rem;
    }

    ul {
        overflow: scroll;
        margin: 0 2rem;
        height: 90%;
    }

    .close {
        position: absolute;
        right: 2rem;
        top: .8rem;
        font-size: 5rem;
    }

    .x:hover {
        color: #f55;
    }

    .delete {
        font-size: 1.2em;
    }

    .delete-all {
        padding: 0;
        margin: 2rem auto;
        margin-bottom: 2rem;
        align-self: flex-end;
    }

    button {
        text-align: left;
        width: unset;
        background: none;
        border: none;
        outline: none;

        color: inherit;
        cursor: pointer;
    }
</style>
