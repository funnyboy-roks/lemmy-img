<script lang="ts">
    import Markdown from 'svelte-exmarkdown';
    import { mention } from '../util';
    import { settings } from '../stores';

    const colour = (n: number): string => {
        const steps = 12;
        // map n to 0..360
        return `hsl(${(n % steps) * Math.floor(360 / steps)}, 50%, 25%`;
    };

    export let self: any;
    export let index: number;
    export let depth: number = 0;
    export let op: string;
</script>

{#if self && self.comment && self.comment.content}
    <div class="comment" style="border-left: 4px solid {colour(index)}">
        <div class="user">{mention('', self.creator, $settings.instance)} {#if self.creator?.actor_id === op}<span class="op">[OP]</span>{/if}</div>
        <div style="color: #aaa">
        <Markdown md={self.comment.content} />
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
        margin: .25rem;
        padding: .5rem;
        max-width: 80vw;
        background: #aaaaaa08;
    }

    .op {
        color: green;
    }
</style>
