<script lang="ts">
    import History from "./lib/History.svelte";
    import Communities from "./lib/Communities.svelte";
    import Settings from "./lib/Settings.svelte";
    import Overlay from "./lib/Overlay.svelte";

    import { sorts, sortsFormatted } from './constants';

    import { mention, userFromActor, communityFromActor } from './util'
    import { history, type QueryData, modal, settings } from './stores';

    let loading = false;

    let queryInput: any;

    let index = 0;
    let posts: any[] = [];
    let pageIndex = 0;
    let userquery: boolean = false;
    let status: string | null = null;

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
        userquery = query.query.startsWith('@')
        if (await getNextPosts()) {
            updateHistory();
            status = null;
        }
        loading = false;
    }

    const getNextPosts = async () => {
        let url;

        let instanceClean = $settings.instance.replace(/\/+$/, '');
        if (userquery) {
            url = `${instanceClean}/api/v3/user?username=${query.query.substring(1)}&sort=${sorts[query.sort]}&page=${++pageIndex}&limit=20`;
        } else {
            const name = query.query.startsWith('!') ? query.query.substring(1) : query.query;
            url = `${instanceClean}/api/v3/post/list?community_name=${name}&sort=${sorts[query.sort]}&page=${++pageIndex}&limit=20`;
        }

        console.log('getting next posts from', url);
        const res = await fetch(url);
        if (res.status === 404) {
            status = 'Unknown community or user'
            return false;
        }
        const body = await res.json();

        console.log('got body:', body);
        const postCounts = body.posts.length;
        const resPosts = body
            .posts
            .filter((b: any) => {
                const user = userFromActor(b.creator.actor_id);
                const comm = communityFromActor(b.community.actor_id)
                return b.post.url
                    && !(userquery && $settings.blocked_instances.includes(new URL(b.community.actor_id).hostname))
                    && !$settings.blocked_instances.includes(userFromActor(b.creator.actor_id).instance)
                    && !$settings.blocked_users.some(u => u.name === user.name && u.instance === user.instance)
                    && !(userquery && $settings.blocked_communities.some(c => c.name === comm.name && c.instance === comm.instance))
                    && (b.post.nsfw && $settings.nsfw !== 'block' || !b.post.nsfw)
                    && !(!b.post.nsfw && $settings.nsfw === 'filter')
                    && (b.creator.bot_account && $settings.bot_posts !== 'block' || !b.creator.bot_account)
                    && !(!b.creator.bot_account && $settings.bot_posts === 'filter')
                    ;
            });
        console.log('got posts:', resPosts);

        if (posts.length + resPosts.length === 0) {
            status = postCounts ? 'Found 0 posts using specified filters.' : 'Found no posts';
            return false;
        }

        posts = [...posts, ...resPosts];
        return true;
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
    }

    const historyGoto = (dest: any) => {
        const q = dest.detail;
        query = q;
        $modal = 'none';
        update();
    };

    const communityGoto = (dest: any) => {
        //alert('todo');
        const q = dest.detail;
        query.query = q;
        $modal = 'communities';
        update();
    };

    const keydown = (e: KeyboardEvent) => {
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
                    if ($modal === 'history') {
                        $modal = 'none';
                    } else {
                        $modal = 'history';
                    }
                    break;
                case 'c':
                    e.preventDefault();
                    if ($modal === 'communities') {
                        $modal = 'none';
                    } else {
                        $modal = 'communities';
                    }
                    break;
                case 's':
                    e.preventDefault();
                    if ($modal === 'settings') {
                        $modal = 'none';
                    } else {
                        $modal = 'settings';
                    }
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

{#if $modal === 'history'}
    <Overlay />
    <History on:goto={historyGoto} />
{:else if $modal === 'communities'}
    <Overlay />
    <Communities on:goto={communityGoto} />
{:else if $modal === 'settings'}
    <Overlay />
    <Settings on:goto={communityGoto} on:close={() => {update()}} />
{/if}

<main>
    <div class="top">
        <button on:click={() => $modal = 'history'}>Open History <code>(h)</code></button>

        <form on:submit|preventDefault={update}>
            <label for="query">Query<label>
            <input id="query" bind:value={query.query} bind:this={queryInput} type="text" />

            <label for="sort">Sort<label>
            <select id="sort" bind:value={query.sort}>
                {#each sortsFormatted as sort, i (i)}
                    <option value={i}>{sort}</option>
                {/each}
            </select>

            <button type="submit">Update</button>
        </form>

        <div class="right">
            <button on:click={() => $modal = 'communities'}>Search Communities <code>(c)</code></button>
        </div>
    </div>

    <div class="nav">
        <button on:click={prevPost} disabled={index === 0}>Prev <code>(←)</code></button>
        <p>{index + 1} / {posts.length}</p>
        <button on:click={nextPost} disabled={index === posts.length - 1}>Next <code>(→)</code></button>
    </div>

    {#if loading}
        <h1>Loading...</h1>
    {/if}

    {#if status}
        <h1>{status}</h1>
    {:else}
        {#if posts[index] && posts[index].post}
            {@const {counts} = posts[index]}
            {@const { type, link } = getType(posts[index])}
            <h1>{posts[index].post.name}</h1>
            <div class="post-info">
                <h2>
                    {#if userquery}
                        {@const community = mention('!', posts[index].community, $settings.instance)}
                        In <button class="query-link" on:click={() => {query.query = community; update()}}>{community}</button>
                    {:else}
                        {@const user = mention('@', posts[index].creator, $settings.instance)}
                        By <button class="query-link" on:click={() => {query.query = user; update()}}>{user}</button>
                    {/if}
                </h2>
                <h2 class="score">
                    <span class:positive={counts.score > 0} class:negative={counts.score < 0}>{counts.score}</span>({(counts.score * 100 / counts.upvotes)|0}%)
                </h2>
            </div>

            {#if type === 'video'}
                <video src="{link}" autoplay controls loop />
            {:else if type === 'image'}
                <img src="{link}" alt="post img"/>
            {:else}
                <iframe src="{link}" frameborder="0" allowfullscreen title="iframe" />
            {/if}
        {/if}
    {/if}

    <div class="bottom">
        <div></div>
        <div></div>
        <div class="right">
            <button on:click={() => $modal = 'settings'}>Settings <code>(s)</code></button>
        </div>
    </div>
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

    h1 {
        text-align: center;
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

    .top, .bottom {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%
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

    img, video, iframe {
        flex-grow: initial;
        height: 75%;
        margin: auto;
        border-radius: 5px;
    }

    iframe {
        width: 100%;
    }
</style>
