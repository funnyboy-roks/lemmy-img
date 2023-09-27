<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { sortsFormatted } from '../constants';

    const dispatch = createEventDispatcher();

    export let history: any[];

    const close = () => {
        dispatch('close');
    };

    const goto = (query: any) => {
        dispatch('goto', query);
    }

    const remove = (index: number) => {
        dispatch('remove', index);
    }

    const deleteAll = () => {
        if (confirm('Are you sure you want to delete your full history?')) {
            dispatch('deleteAll');
        }
    }
</script>

<div class="overlay" on:click={close}></div>
<div class="history">
    <button class="close x" on:click={close}>&times;</button>
    <h1>History:</h1>
    <ul>
    {#each history as entry, i (i)}
        <li>
            <button on:click={() => goto(entry)}>{entry.query} ({sortsFormatted[entry.sort]})</button>
            <button class="delete x" on:click={() => remove(i)}>&times;</button>
        </li>
    {/each}
    </ul>
    <button class="delete-all x" on:click={deleteAll}>Delete All</button>
</div>

<style>
    .overlay {
        position: fixed;
        left: 0;
        top: 0;
        background: #222a;
        width: 100vw;
        height: 100vh;
    }

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
    }

    .close {
        position: absolute;
        right: 2rem;
        top: 2rem;
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
        margin-bottom: 2rem;
        margin-top: auto;
        margin-left: 0;
    }

    button {
        font-size: 1.5rem;
        background: none;
        border: none;
        outline: none;

        color: inherit;
        cursor: pointer;
    }

    button:hover {
        color: grey;
    }
</style>
