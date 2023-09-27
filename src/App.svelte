<script lang="ts">
    import History from "./lib/History.svelte";
    import { persisted as localStore } from 'svelte-local-storage-store';

    import { sorts, sortsFormatted } from './constants';

    let loading = false;

    interface QueryData {
        query: string,
        sort: number,
    }

    let queryInput: any;

    let showHistory = false;
    let history = localStore<QueryData[]>('history', []);
    let instanceStore = localStore<string>('instance', 'https://lemmy.ml');

    let index = 0;
    let posts: any[] = [];
    let pageIndex = 0;
    let userquery: boolean = false;

    let instance = $instanceStore;

    let query: QueryData = {
        query: $history[0]?.query ?? '!unixporn@lemmy.ml',
        sort: $history[0]?.sort ?? 1,
    };

    const update = async () => {
        if (loading) return;
        loading = true;
        index = 0;
        pageIndex = 0;
        posts = [];
        $instanceStore = instance;
        userquery = query.query.startsWith('@')
        await getNextPosts();
        updateHistory();
        loading = false;
    }

    const getNextPosts = async () => {
        let url;

        let instanceClean = instance.replace(/\/+$/, '');
        if (userquery) {
            url = `${instanceClean}/api/v3/user?username=${query.query.substring(1)}&sort=${sorts[query.sort]}&page=${++pageIndex}`;
        } else {
            const name = query.query.startsWith('!') ? query.query.substring(1) : query.query;
            url = `${instanceClean}/api/v3/post/list?community_name=${name}&sort=${sorts[query.sort]}&page=${++pageIndex}`;
        }

        console.log('getting next posts from', url);
        const res = await fetch(url);
        const body = await res.json();

        console.log('got body:', body);
        const resPosts = body
            .posts
            .filter((b: any) => b.post.url);
            console.log('got posts:', resPosts);

        posts = [...posts, ...resPosts];
    };

    const nextPost = () => {
        ++index;

        if (index >= posts.length - 5) {
            getNextPosts();
        }

        if (index >= posts.length) {
            index = posts.length - 1;
        }
    };

    const prevPost = () => {
        --index;
        if (index < 0) index = 0;
    };

    const updateHistory = () => {
        let hist = $history;
        const h = hist.filter(e => e.query !== query.query || e.sort !== query.sort);
        h.unshift(query);
        $history = h;
        query = { ...query };
        console.log('history update', $history);
    }

    const historyGoto = (dest: any) => {
        const q = dest.detail;
        query = q;
        showHistory = false;
        update();
    };

    const historyRemove = (dest: any) => {
        $history = $history.filter((_, i) => i !== dest.detail);
    };

    const mention = (prefix: string, { name, actor_id }: any): string => {
        const instance = new URL(actor_id).hostname;
        return `${prefix}${name}@${instance}`;
    }

    const keydown = (e: KeyboardEvent) => {
        console.log(e);
        // @ts-ignore
        if (e.target.nodeName !== 'INPUT') {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault()
                    nextPost();
                    break;
                case 'ArrowLeft':
                    e.preventDefault()
                    prevPost();
                    break;
                case 'h':
                    e.preventDefault();
                    // @ts-ignore
                    showHistory ^= 1;
                    break;
                case '/': 
                    e.preventDefault();
                    queryInput.select();
                    break;
            }
        } else {
            if (e.key === 'Escape') {
                e.preventDefault();
                // @ts-ignore
                e.target.blur();
            }
        }
    }

    const getType = ({ post }: any) => {
        let link = post.thumbnail_url ?? post.url
        let type = 'image';

        if (link.endsWith('.mp4')) {
            type = 'video';
        }

        if (post.embed_video_url) {
            type = 'video';
            link = post.embed_video_url;
        }

        return { link, type };
    }

    update();
</script>

<svelte:window on:keydown={keydown} />
<svelte:head>
    {#if posts[index]?.community.icon}
        <link rel="icon" href="{posts[index]?.community.icon}" />
    {/if}
</svelte:head>

{#if showHistory}
    <History history={$history} on:close={() => showHistory = false} on:goto={historyGoto} on:remove={historyRemove} on:deleteAll={() => $history = []} />
{/if}
<main>
    <div class="top">
        <button on:click={() => showHistory = !showHistory}>Open History</button>

        <form on:submit|preventDefault={update}>
            <label for="query">Query<label>
            <input id="query" bind:value={query.query} bind:this={queryInput} type="text" />

            <label for="sort">Sort<label>
            <select id="sort" bind:value={query.sort}>
                {#each sortsFormatted as sort, i (i)}
                    <option value={i}>{sort}</option>
                {/each}
            </select>

            <label for="instance">Instance<label>
            <input id="instance" bind:value={instance} type="text"/>

            <button type="submit">Update</button>
        </form>

        <div class="right">
            {#if loading}
                <p>Loading...</p>
            {/if}
        </div>
    </div>

    <div class="nav">
        <button on:click={prevPost} disabled={index === 0}>Prev</button>
        <p>{index + 1} / {posts.length}</p>
        <button on:click={nextPost} disabled={index === posts.length - 1}>Next</button>
    </div>

    {#if posts[index] && posts[index].post}
        {@const {counts} = posts[index]}
        {@const { type, link } = getType(posts[index])}
        <h1 style="text-align: center">{posts[index].post.name}</h1>
        <div class="post-info">
            <h2>
                {#if userquery}
                    {@const community = mention('!', posts[index].community)}
                    In <button class="query-link" on:click={() => {query.query = community; update()}}>{community}</button>
                {:else}
                    {@const user = mention('@', posts[index].creator)}
                    By <button class="query-link" on:click={() => {query.query = user; update()}}>{user}</button>
                {/if}
            </h2>
            <h2 class="score">
                <span class:positive={counts.score > 0} class:negative={counts.score < 0}>{counts.score}</span>({(counts.score * 100 / counts.upvotes)|0}%)
            </h2>
        </div>
        {#if type === 'video'}
            <video src="{link}" autoplay controls />
        {:else if type === 'image'}
            <img src="{link}" alt="post img"/>
        {:else}
            <iframe src="{link}" frameborder="0" allowfullscreen title="iframe" />
        {/if}
    {/if}
</main>

<style>
    main {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #000;
        justify-content: start;
    }

    * {
        font-weight: normal;
    }

    .query-link {
        text-decoration: 2px dotted underline;
        width: unset;
        background: unset;
        padding: unset;
        color: unset;
        font-size: unset;
        outline: none;
        border: none;
        margin: unset;
    }

    .query-link:hover {
        text-decoration: 2px solid underline;
    }


    button, input, select {
        width: 10rem;
        background: #333;
        padding: .25rem;
        color: lightgrey;
        font-size: 1.2rem;
        outline: none;
        border: 2px solid grey;
        border-radius: 5px;
        margin: .25rem;
    }

    button:focus, input:focus, select:focus {
        outline: 2px solid AccentColor;
    }

    button {
        cursor: pointer;
    }

    input {
        width: 15rem;
    }

    form {
        display: block;
        font-size: 1.2rem;
    }

    .nav {
        display: flex;
        flex-direction: row;
        margin: 0 auto;
    }

    .nav button {
        width: unset;
    }

    .top {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%
    }

    .post {
        margin: 0 auto;
        text-align: center;
        display: flex;
        flex-direction: column;
    }

    .post-info {
        display: flex;
        flex-direction: row;
        margin: 0 auto;
        padding: 0;
        text-align: center;
    }

    .score {
        font-family: monospace;
    }

    .positive {
        color: #aea;
    }

    .negative {
        color: #eaa;
    }

    .post-info h2 {
        padding: 0 1rem;
        margin: 0;
    }

    img, video {
        flex-grow: initial;
        max-width: 85%;
        max-height: 75%;
        margin: auto;
        border-radius: 5px;
    }
</style>
