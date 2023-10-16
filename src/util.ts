import type { User, Community, Filter } from "./stores";

export const mention = (prefix: string, { name, actor_id }: any, host: string = ''): string => {
    const instance = new URL(actor_id).hostname;
    if (host) {
        const hostname = new URL(host).hostname;
        if (hostname === instance) {
            return `${prefix}${name}`;
        }
    }
    return `${prefix}${name}@${instance}`;
};


export const userFromActor = (a: string): User => {
    let instance = new URL(a).hostname;
    let name = a.substring(a.lastIndexOf('/') + 1);
    return { name, instance };
};

export const communityFromActor = (a: string): Community => {
    let instance = new URL(a).hostname;
    let name = a.substring(a.lastIndexOf('/') + 1);
    return { name, instance };
};

/**
 * Returns true if the given bool matches the selected filter
 */
export const filterCheck = (filter: Filter, bool: boolean): boolean => {
    if (filter === 'allow') return true;
    if (filter === 'block') return !bool;
    if (filter === 'filter') return bool;
    return false; // should be unreachable
}
