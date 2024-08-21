<script lang="ts">
    import { isImage, isVideo } from '../util';

    export let post: any;
    console.log(post);

    let url: string;
    let imgSrc: string | undefined;
    $: {
        ({ url } = post);
        url = url.replace('/watch/', '/ifr/');
        const thumbnail = post.thumbnail_url;

        if (thumbnail) {
            imgSrc = thumbnail;
        } else if (url && isImage(url)) {
            imgSrc = url;
        } else {
            imgSrc = undefined;
        }
    }

    let error = false;
    let loading = true;

    const keydown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement) return;
        switch (e.key) {
            case 'l':
                loading = !loading;
                break;
        }
    };
</script>

<svelte:window on:keydown={keydown} />

{#if error}
    Error
{:else if loading}
    Loading
{/if}

{#if url && (isVideo(url)/* || post.embed_video_url*/)}
    <video autoplay controls loop
           on:error={() => error = true} on:load={() => loading = false}
           class:hide={error || loading}
           >
        <source src={post.embed_video_url ?? url} type="video/mp4" />
    </video>
{:else if imgSrc}
    <img src={imgSrc}
         alt={post.alt_text}
         on:error={() => error = true}
         on:load={() => loading = false}
         class:hide={error || loading}
     />
{:else}
    <iframe src="{url}"
            frameborder="0"
            allowfullscreen
            title="iframe"
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
            on:load={() => loading = false}
            on:error={() => error = true}
            class:hide={error || loading}
        />
{/if}

<style>
    img, video, iframe {
        flex-grow: initial;
        height: 75%;
        margin: auto;
        border-radius: 5px;
    }

    iframe {
        width: 100%;
    }

    .hide {
        display: none;
    }

</style>
