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

/**
 * Takes an array of comments (anything with a `path` field) and converts it into a valid tree repr with a `children` field.
 */
export const treeComments = (comments: any[]): any[] => {
    const tree: any[] = [];
    const ref_from_id = (tree: any[], id: number) => {
        for (const c of tree) {
            if (c.id === id) return c;
        }
        return null;
    };

    for (const d of comments) {
        const parts = d.comment.path.split('.').slice(1);
        let ref = ref_from_id(tree, parts[0]);
        if (!ref) {
            tree.push(ref = { id: parts[0], children: [] });
        }

        for (const part of parts.slice(1)) {
            let parent;
            ref = ref_from_id((parent = ref).children, part); 
            if (!ref) {
                parent.children.push(ref = { id: part, children: [] });
            }
        }

        Object.entries(d).forEach(([k, v]) => {
            if (k === 'post' || k === 'community') return;
            ref[k] = v;
        });
    }

    return tree;
}
