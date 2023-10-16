<script lang="ts">
    import History from "./lib/History.svelte";
    import Communities from "./lib/Communities.svelte";
    import Settings from "./lib/Settings.svelte";
    import Overlay from "./lib/Overlay.svelte";
    import Post from "./lib/Post.svelte";

    import { sorts, sortsFormatted } from './constants';

    import { mention, userFromActor, communityFromActor, filterCheck } from './util'
    import { history, type QueryData, modal, settings, posts } from './stores';

    let loading = false;

    let queryInput: any;

    let index = 0;
    let pageIndex = 0;
    let userquery: boolean = false;
    let status: string | null = null;
    let preloads: string[] = [];

    let query: QueryData = {
        query: $history[0]?.query ?? '!unixporn@lemmy.ml',
        sort: $history[0]?.sort ?? 1,
    };

    const update = async () => {
        if (loading) return;
        loading = true;
        index = 0;
        pageIndex = 0;
        $posts = [];
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
                    && filterCheck($settings.nsfw, b.post.nsfw)
                    && filterCheck($settings.bot_posts, b.creator.bot_account)
                    ;
            });
        console.log('got posts:', resPosts);

        if ($posts.length + resPosts.length === 0) {
            status = postCounts ? 'Found 0 posts using specified filters.' : 'Found no posts';
            return false;
        }

        $posts = [...$posts, ...resPosts];
        return true;
    };

    $: preloads = $posts.slice(index, Math.min(index + 5, $posts.length)).map(({ post: p }) => p.thumbnail_url ?? p.url ?? p.embed_video_url);

    const nextPost = () => {
        ++index;

        if (index >= $posts.length - 5) {
            getNextPosts();
        }

        if (index >= $posts.length) {
            index = $posts.length - 1;
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

    update();
</script>

<svelte:window on:keydown={keydown} />
<svelte:head>
    {#if $posts[index]?.community.icon}
        <link rel="icon" href="{$posts[index]?.community.icon}" />
    {/if}
    {#each preloads as p, i (i)}
        <link rel="preload" as="image" href={p} />
    {/each}

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
{:else if $modal === 'saved'}
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
        <p>{index + 1} / {$posts.length}</p>
        <button on:click={nextPost} disabled={index === $posts.length - 1}>Next <code>(→)</code></button>
    </div>

    {#if loading}
        <h1>Loading...</h1>
    {/if}

    {#if status}
        <h1>{status}</h1>
    {:else}
        <Post {index} {userquery}
              on:updateQuery={q => {query.query = q.detail; update()}} />
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
</style>
