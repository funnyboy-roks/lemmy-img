<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { sorts, sortsFormatted } from '../constants';
    import { mention, communityFromActor, filterCheck } from '../util';
    import { communities as communitiesStores, instanceStore, modal, settings } from '../stores';

    const { query, communities } = communitiesStores;

    const dispatch = createEventDispatcher();

    const close = () => {
        $modal = 'none';
    };

    const goto = (query: any) => {
        dispatch('goto', query);
    }

    let hasSearched = false;

    let searching = false;
    const search = async () => {
        hasSearched = true;
        searching = true;
        if ($query.query.trim() === '') {
            $communities = [];
            searching = false;
            return alert('Missing required fields: query');
        }
        const instanceClean = $instanceStore.replace(/\/+$/, '');
        const url = `${instanceClean}/api/v3/search?q=${$query.query}&type_=Communities&sort=${sorts[$query.sort]}&limit=50`;

        const res = await fetch(url);
        const json = await res.json();
        let coms: any[] = json.communities.filter((c: any) => {
            let comm = communityFromActor(c.community.actor_id);
            return !$settings.blocked_communities.some(c => c.instance === comm.instance && c.name === comm.name)
            && !$settings.blocked_instances.includes(comm.instance)
            && filterCheck($query.nsfw, c.community.nsfw);
        });
        coms.sort((a, b) => b.counts.posts - a.counts.posts);
        $communities = coms;
        searching = false;
    };

    const init = (el: HTMLElement) => {
        el.focus();
    };

    const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    };
</script>

<svelte:window on:keydown={keydown} />

<div class="overlay" on:click={close} />
<div class="communities">
    <!--<button class="close x" on:click={close}>&times;</button>-->
    <div class="header">
        <h1>Communities</h1>
        <form on:submit|preventDefault={search}>
            <input type="text" placeholder="Search for communities..." style="width: 80%" bind:value={$query.query} use:init/>
            <br>
            <select id="sort" bind:value={$query.sort}>
                {#each sortsFormatted as sort, i (i)}
                    <option value={i}>{sort}</option>
                {/each}
            </select>
            <select id="nsfw" bind:value={$query.nsfw}>
                <option value="allow">Allow NSFW</option>
                <option value="block">Block NSFW</option>
                <option value="filter">Filter NSFW</option>
            </select>
            <button type="submit">Search</button>
        </form>
    </div>

    {#if searching}
        <div class="status">Searching...</div>
    {:else}
        <ul>
        {#each $communities as c, i (i)}
            {@const m = mention('!', c.community, $instanceStore)}
            <li>
                <img class="community-icon" src={c.community.icon} />
                <button class="query-link" on:click={() => goto(m)}>{m} ({c.counts.posts} post{c.counts.posts === 1 ? '' : 's'})</button>
            </li>
        {:else}
            <div class="status">
                {#if hasSearched}
                    No communities found
                {:else}
                    Search for a community above
                {/if}
            </div>
        {/each}
        </ul>
    {/if}
</div>

<style>
    .overlay {
        position: fixed;
        right: 0;
        top: 0;
        background: #222a;
        width: 100vw;
        height: 100vh;
    }

    .status {
        width: 100%;
        text-align: center;
        padding-top: 5rem;
    }

    .communities {
        position: fixed;
        right: 0;
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

    .community-icon {
        max-height: 2rem;
        max-width: 5rem;
        width: auto;
    }

    .header {
        width: 100%;
        text-align: center;
    }

    ul {
        overflow: scroll;
        margin: 0 2rem;
    }

    .close {
        position: absolute;
        left: 2rem;
        top: 1rem;
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

    button.query {
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
