import { writable } from "svelte/store";
import { persisted as localStore } from 'svelte-local-storage-store';

export interface CommunitiesQuery {
    query: string,
    sort: number,
    nsfw: Filter,
}

export const communities = {
    query: writable<CommunitiesQuery>({ query: '', sort: 1 }),
    communities: writable<any[]>([]),
};

export interface QueryData {
    query: string,
    sort: number,
}

export const instanceStore = localStore<string>('instance', 'https://lemmy.ml');
export const history = localStore<QueryData[]>('history', []);
export const posts = writable<any[]>([]);

export type Modal = 'none' | 'history' | 'communities' | 'settings' | 'saved';
export const modal = writable<Modal>('none');

export interface Community {
    name: string,
    instance: string, // hostname
}

export interface User {
    name: string,
    instance: string, // hostname
}

export type Filter = 'allow' | 'block' | 'filter';

export interface Settings {
    instance: string,
    blocked_instances: string[], // hostname
    blocked_communities: Community[],
    blocked_users: User[],
    nsfw: Filter,
    bot_posts: Filter,
}

export const settings = localStore<Settings>('settings', { 
    instance: 'https://lemmy.ml',
    blocked_instances: [],
    blocked_communities: [],
    blocked_users: [],
    nsfw: 'allow',
    bot_posts: 'allow',
});
