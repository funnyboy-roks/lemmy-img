<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { sortsFormatted } from '../constants';
    import { modal, settings } from '../stores';
    import type { User, Community } from '../stores';
    import { mention } from '../util';

    const dispatch = createEventDispatcher();

    const close = () => {
        $modal = 'none';
        dispatch('close');
    };

    const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }

    const mentionUser = (u: User): string => {
        return `@${u.name}@${u.instance}`;
    };

    const mentionCommunity = (c: Community): string => {
        return `!${c.name}@${c.instance}`;
    };

    const userFromMention = (s: string): User => {
        if (s.startsWith('@')) {
            s = s.substring(1);
        }

        const [ name, instance ] = s.split('@');

        return {
            name,
            instance: instance ?? new URL($settings.instance).hostname,
        };
    };

    const communityFromMention = (s: string): Community => {
        if (s.startsWith('!')) {
            s = s.substring(1);
        }

        const [ name, instance ] = s.split('@');

        return {
            name,
            instance: instance ?? new URL($settings.instance).hostname,
        };
    };

    let blocked_instances: string = $settings.blocked_instances.join(',');
    let blocked_users: string = $settings.blocked_users.map(mentionUser).join(',');
    let blocked_communities: string = $settings.blocked_communities.map(mentionCommunity).join(',');

    $: {
        $settings.blocked_instances = blocked_instances
            .split(',')
            .filter(i => i)
            .map(i => i.includes('/') ? new URL(i).hostname : i);

        $settings.blocked_users = blocked_users
            .split(',')
            .filter(i => i)
            .map(userFromMention);

        $settings.blocked_communities = blocked_communities
            .split(',')
            .filter(i => i)
            .map(communityFromMention);
    };
</script>

<svelte:window on:keydown={keydown} />

<div class="settings">
    <div class="heading">
        <h1>Settings</h1>
        <button class="close x" on:click={close}>&times;</button>
    </div>
    <div class="body">
        <label for="instance">
            <span>Instance</span>
            <input id="instance" type="text" bind:value={$settings.instance}/>
        </label>

        <label for="blocked-instances" title="Comma-separated list of blocked instances">
            <span>Blocked Instances</span>
            <input id="blocked-instances" type="text" bind:value={blocked_instances}/>
        </label>

        <label for="blocked-users" title="Comma-separated list of blocked users">
            <span>Blocked Users</span>
            <input id="blocked-users" type="text" bind:value={blocked_users}/>
        </label>

        <label for="blocked-communities" title="Comma-separated list of blocked communities">
            <span>Blocked Communities</span>
            <input id="blocked-communities" type="text" bind:value={blocked_communities}/>
        </label>

        <label for="nsfw" title="Show NSFW posts">
            <span>NSFW</span>
            <select id="nsfw" bind:value={$settings.nsfw}>
                <option value="allow">Allow</option>
                <option value="block">Block</option>
                <option value="filter">Filter</option>
            </select>
        </label>

        <label for="bot" title="Show NSFW posts">
            <span>Bot posts</span>
            <select id="bot" bind:value={$settings.bot_posts}>
                <option value="allow">Allow</option>
                <option value="block">Block</option>
                <option value="filter">Filter</option>
            </select>
        </label>
    </div>
    <div class="footer">
        <button class="save" on:click={() => close()}>Save</button>
    </div>
</div>

<style>
    .settings {
        width: 50%;
        /*height: 50%;*/
        overflow: scroll;
        position: fixed;
        left: 50vw;
        top: 50vh;
        transform: translate(-50%, -50%);
        border-radius: 10px;

        background: #222;
        padding: 2rem;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .heading {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding-bottom: 1rem;
        border-bottom: 1px solid #333;
        margin-bottom: 3rem;
    }

    h1, button {
        margin: 0;
        line-height: 3rem;
    }

    .close {
        font-size: 5rem;
        background: none;
        border: none;
        outline: none;
        width: unset;
    }

    .x:hover {
        color: #f55;
    }

    .body {
        display: flex;
        flex-direction: column;
        width: 50%;
        margin: auto;
    }

    .footer {
        margin: auto;
        width: 50%;
        padding-top: 2rem;
    }

    .save {
        font-size: 2rem;
        width: 100%;
    }

    label {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 1rem 1rem;
        margin: .25rem;
        border-radius: 10px;
        transition: background 100ms ease-in-out;
    }

    label:hover {
        background: #6661
    }

    label span {
        font-size: 1.2rem;
        margin: auto 0;
    }

    select {
        width: 15.5rem;
    }

</style>
