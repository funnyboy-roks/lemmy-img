<script lang="ts">
    export let index: number;
    export let userquery: boolean;

    import { mention } from '../util'
    import { posts, settings } from '../stores';
    import { createEventDispatcher } from 'svelte';


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


    const dispatch = createEventDispatcher();
</script>
{#if $posts[index] && $posts[index].post}
    {@const post = $posts[index]}
    {@const { counts } = post}
    {@const { type, link } = getType(post)}
    <h1>{post.post.name}</h1>
    <div class="post-info">
        <h2>
            {#if userquery}
                {@const community = mention('!', post.community, $settings.instance)}
                In <button class="query-link" on:click={() => dispatch('updateQuery', community)}>{community}</button>
            {:else}
                {@const user = mention('@', post.creator, $settings.instance)}
                By <button class="query-link" on:click={() => dispatch('updateQuery', user)}>{user}</button>
            {/if}
        </h2>
        <h2 class="score">
            <span class:positive={counts.score > 0} class:negative={counts.score < 0}>{counts.score}</span>({(counts.score * 100 / counts.upvotes)|0}%)
        </h2>
    </div>

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
