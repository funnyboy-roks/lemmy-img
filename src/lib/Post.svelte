<script lang="ts">
    export let index: number;
    export let userquery: boolean;
    export let show_user_and_comm: boolean = false;

    import { mention, treeComments } from '../util'
    import { posts, settings, savedPosts, modal } from '../stores';
    import { createEventDispatcher } from 'svelte';
    import Comment from './Comment.svelte'
    import Markdown from 'svelte-exmarkdown';

    const DTF = Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'long', year: 'numeric' });

    const getType = ({ post }: any) => {
        let link = post.thumbnail_url ?? post.url
        let type = 'image';

        if (link.includes('embed')) {
            type = 'embed';
        } else if (link.endsWith('.mp4')) {
            type = 'video';
        } else if (post.embed_video_url) {
            type = 'embed';
            link = post.url.replace(/\/watch\//gi, '/ifr/');
            // type = 'video';
            // link = post.embed_video_url;
            // if (link.includes('embed')) {
            //     type = 'embed';
            // }
        }

        console.log({ link, type });

        return { link, type };
    }

    const isSaved = (index: number): boolean =>  {
        const post = $posts[index];
        if (!post) return false;
        for (const s of $savedPosts) {
            console.log ({ s, post });
            if (s.post.ap_id === post.post.ap_id) {
                console.log('saved')
                return true;
            }
        }
        console.log('not saved')
        return false;
    }

    let star: string;

    let saved: boolean;
    let showingComments = false;
    let loadingComments = false;
    let showingBody = false;
    let imageIndex = 0;
    let images: string[] = [];
    $: {
        showingComments = false;
        loadingComments = false;
        showingBody = false;
        saved = isSaved(index);
        imageIndex = 0;
        images = bodyImages($posts[index]?.post.body);
        updateStar();
    };

    const updateStar = () => {
        star = saved ? '★' : '☆';
    }

    const toggleSave = () => {
        console.log('saving', saved);
        if (saved) {
            $savedPosts = $savedPosts.filter(p => p.post.ap_id !== $posts[index].post.ap_id);
            saved = false;
        } else {
            $savedPosts = [...$savedPosts, $posts[index]];
            saved = true;
        }
    }

    const bodyImages = (s: string): string[] => {
        if (!s) return [];
        return s.match(/!\[.*?\]\(.*?\)/g)
            ?.map(m => m.replace(/^!\[.*?\]\(/, ''))
            .map(s => s.substring(0, s.length - 1)) ?? []
    };

    let comments: any[] = [];
    const getComments = async () => {
        let instanceClean = $settings.instance.replace(/\/+$/, '');
        const res = await fetch(`${instanceClean}/api/v3/comment/list?post_id=${$posts[index].post.id}&max_depth=8`);
        const json = await res.json();
        comments = treeComments(json.comments);
    }

    const showComments = async () => {
        showingComments = loadingComments = true;
        await getComments();
        loadingComments = false;
    }

    const toggleBody = () => {
        showingBody = $posts[index].post.body && !showingBody;
    };

    setTimeout(() => {
        saved = isSaved(index);
        updateStar()
    }, 500);
    const dispatch = createEventDispatcher();

    const keydown = (e: KeyboardEvent) => {
        // `any` cast because nodeName "doesn't exist" on e.target
        if ((e.target as any).nodeName === 'INPUT') return;
        switch (e.key) {
            case 'b':
                toggleBody();
                break;
            case 'ArrowDown':
                ++imageIndex;
                if (imageIndex > images.length) imageIndex = images.length;
                break;
            case 'ArrowUp':
                --imageIndex;
                if (imageIndex < 0) imageIndex = 0;
                break;
        }
    };

</script>

<svelte:window on:keydown={keydown} />

{#if $posts[index]?.post && $posts[index].post}
    {@const post = $posts[index]}
    {@const { counts } = post}
    <h1>{post.post.name} <button class="save" on:mouseover={() => star = '★'} on:mouseleave={updateStar} on:click={toggleSave}>{star}</button></h1>
    <div class="post-info">
        <h2>
            {#if $modal == 'saved' || show_user_and_comm }
                {@const community = mention('!', post.community, $settings.instance)}
                {@const user = mention('@', post.creator, $settings.instance)}
                By <button class="query-link" on:click={() => dispatch('updateQuery', user)}>{user}</button>
                In <button class="query-link" on:click={() => dispatch('updateQuery', community)}>{community}</button>
            {:else if userquery}
                {@const community = mention('!', post.community, $settings.instance)}
                In <button class="query-link" on:click={() => dispatch('updateQuery', community)}>{community}</button>
            {:else}
                {@const user = mention('@', post.creator, $settings.instance)}
                By <button class="query-link" on:click={() => dispatch('updateQuery', user)}>{user}</button>
            {/if}
        </h2>
        <h2>
            {DTF.format(new Date($posts[index].post.published))}
        </h2>
        <h2 class="score">
            <span class:positive={counts.score > 0} class:negative={counts.score < 0}>{counts.score}</span>({(counts.score * 100 / counts.upvotes)|0}%)
        </h2>
        {#if post.counts.comments > 0}
            {#if showingComments}
                <button class="info-button" on:click={() => showingComments = false}>Hide Comments</button>
            {:else}
                <button class="info-button" on:click={() => showComments()}>Comments ({ post.counts.comments })</button>
            {/if}
        {/if}
        {#if post.post.body}
            <button class="info-button" on:click={toggleBody}>{ showingBody ? 'Hide' : 'Show' } Body {#if images.length}({imageIndex}/{images.length}){/if}</button>
        {/if}
    </div>

    {#if showingBody}
        <div class="body">
            <Markdown md={post.post.body} />
        </div>
    {:else if showingComments}
        <div class="comments">
            {#if loadingComments}
                <h1>Loading...</h1>
            {:else}
                {#each comments as comment, i (i)}
                    <Comment self={comment} index={i} depth={0} op={$posts[index].creator.actor_id} on:updateQuery />
                {:else}
                    <h1>No Comments</h1>
                {/each}
            {/if}
        </div>
    {:else if imageIndex > 0}
        <img src="{images[imageIndex - 1]}" alt="post img {imageIndex}" />
    {:else}
        {@const { type, link } = getType(post)}
        {#if type === 'video'}
            <video src="{link}" autoplay controls loop>
                <track kind="captions" />
            </video>
        {:else if type === 'image'}
            <img src="{link}" alt="post img"/>
        {:else}
            <iframe src="{link}" frameborder="0" allowfullscreen title="iframe" />
        {/if}
    {/if}
{/if}

<style>
    h1 {
        text-align: center;
    }

    .post-info {
        display: flex;
        flex-direction: row;
        margin: 0 auto;
        padding: 0;
        text-align: center;
    }

    button {
        max-width: unset;
        padding: .25rem;
    }

    .score {
        font-family: monospace;
        font-size: 1.75rem;
    }

    .post-info h2 {
        padding: 0 1rem;
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

    .save {
        color: gold;
        background: none;
        border: none;
        outline: none;
        font-size: 2rem;
    }

    .info-button {
        margin: auto .25rem;
        padding: .25rem 1rem;
    }

    .comments {
        margin: auto;
        background: black;
    }

    .body {
        width: 50%;
        margin: auto;
    }

    .body :global(img) {
        max-width: 100%;
    }
</style>
