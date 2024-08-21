<script lang="ts">
    import Markdown from 'svelte-exmarkdown';
    import { mention } from '../util';
    import { settings } from '../stores';
    import { createEventDispatcher } from 'svelte';
    import { markdownPlugins } from '../util';

    const colour = (n: number): string => {
        const steps = 12;
        // map n to 0..360
        return `hsl(${(n % steps) * Math.floor(360 / steps)}, 50%, 25%`;
    };
    const dispatch = createEventDispatcher();

    export let self: any;
    export let index: number;
    export let depth: number = 0;
    export let op: string;
</script>

{#if self && self.comment && self.comment.content}
    {@const user = mention('@', self.creator, $settings.instance)}
    <div class="comment" style="border-left: 2px solid {colour(index)}; margin: {depth === 0 ? '2rem' : ''} .25rem">
        <div class="comment-info">
            <div class="user">
                <button class="query-link" on:click={() => dispatch('updateQuery', user)}>{user}</button>{#if self.creator?.actor_id === op}<span class="op">[OP]</span>{/if}</div>
            <div class="score">
                <span class:positive={self.counts.score > 0} class:negative={self.counts.score < 0}>{self.counts.score}</span>({(self.counts.score * 100 / self.counts.upvotes)|0}%)
            </div>
        </div>
        <div style="color: #aaa">
            <Markdown md={self.comment.content} plugins={markdownPlugins} />
        </div>
        {#if self.children}
            {#each self.children as comment, i (i)}
                <svelte:self self={comment} index={i + depth} depth={depth + 1} {op} />
            {/each}
        {/if}
    </div>
{/if}

<style>
    .comment {
        padding: .5rem;
        max-width: 80vw;
        background: #aaaaaa08;
    }

    .op {
        color: green;
    }

    .comment-info {
        display: flex;
    }

    .score {
        padding-left: 2rem;
    }
</style>
