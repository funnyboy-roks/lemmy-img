import type { User, Community } from "./stores";

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
