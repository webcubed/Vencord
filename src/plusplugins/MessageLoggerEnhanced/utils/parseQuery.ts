/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChannelStore, GuildStore } from "@webpack/common";

import { LoggedMessageJSON } from "../types";
import { getGuildIdByChannel } from "./index";
import { memoize } from "./memoize";


const validIdSearchTypes = ["server", "guild", "channel", "in", "user", "from", "message", "has", "before", "after", "around", "near", "during"] as const;
type ValidIdSearchTypesUnion = typeof validIdSearchTypes[number];

interface QueryResult {
    key: ValidIdSearchTypesUnion;
    value: string;
    negate: boolean;
}

export const parseQuery = memoize((query: string = ""): QueryResult | string => {
    let trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return query;
    }

    let negate = false;
    if (trimmedQuery.startsWith("!")) {
        negate = true;
        trimmedQuery = trimmedQuery.substring(trimmedQuery.length, 1);
    }

    const [filter, rest] = trimmedQuery.split(" ", 2);
    if (!filter) {
        return query;
    }

    const [type, id] = filter.split(":") as [ValidIdSearchTypesUnion, string];
    if (!type || !id || !validIdSearchTypes.includes(type)) {
        return query;
    }

    return {
        key: type,
        value: id,
        negate,
    };
});

export const tokenizeQuery = (query: string) => {
    const parts = query.split(" ").map(parseQuery);
    const queries = parts.filter(p => typeof p !== "string") as QueryResult[];
    const rest = parts.filter(p => typeof p === "string") as string[];

    return { queries, rest };
};

const linkRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const doesMatch = (type: typeof validIdSearchTypes[number], value: string, message: LoggedMessageJSON) => {
    switch (type) {
        case "in":
        case "channel":
            const channel = ChannelStore.getChannel(message.channel_id);
            if (!channel)
                return message.channel_id === value;
            const { name, id } = channel;
            return id === value
                || name.toLowerCase().includes(value.toLowerCase());
        case "message":
            return message.id === value;
        case "from":
        case "user":
            return message.author.id === value
                || message.author?.username?.toLowerCase().includes(value.toLowerCase())
                || (message.author as any)?.globalName?.toLowerCase()?.includes(value.toLowerCase());
        case "guild":
        case "server": {
            const guildId = message.guildId ?? getGuildIdByChannel(message.channel_id);
            if (!guildId) return false;

            const guild = GuildStore.getGuild(guildId);
            if (!guild)
                return guildId === value;

            return guild.id === value
                || guild.name.toLowerCase().includes(value.toLowerCase());
        }
        case "before":
            return new Date(message.timestamp) < new Date(value);
        case "after":
            return new Date(message.timestamp) > new Date(value);
        case "around":
        case "near":
        case "during":
            return Math.abs(new Date(message.timestamp).getTime() - new Date(value).getTime()) < 1000 * 60 * 60 * 24;
        case "has": {
            switch (value) {
                case "attachment":
                    return message.attachments.length > 0;
                case "image":
                    return message.attachments.some(a => a.content_type?.startsWith("image")) ||
                        message.embeds.some(e => e.image || e.thumbnail);
                case "video":
                    return message.attachments.some(a => a.content_type?.startsWith("video")) ||
                        message.embeds.some(e => e.video);
                case "embed":
                    return message.embeds.length > 0;
                case "link":
                    return message.content.match(linkRegex);
                default:
                    return false;
            }
        }
        default:
            return false;
    }
};
