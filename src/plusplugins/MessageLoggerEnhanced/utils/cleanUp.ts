/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessageStore } from "@webpack/common";
import { User } from "discord-types/general";

import { LoggedMessageJSON, ReferencedMessage } from "../types";
import { getGuildIdByChannel, isGhostPinged } from "./index";

export function cleanupMessage(message: any, removeDetails: boolean = true): LoggedMessageJSON {
    const ret: LoggedMessageJSON = typeof message.toJS === "function" ? JSON.parse(JSON.stringify(message.toJS())) : { ...message };
    if (removeDetails) {
        ret.author.phone = undefined;
        ret.author.email = undefined;
    }

    ret.ghostPinged = ret.mentioned ?? isGhostPinged(message);
    ret.guildId = ret.guild_id ?? getGuildIdByChannel(ret.channel_id);
    ret.embeds = (ret.embeds ?? []).map(cleanupEmbed);
    ret.deleted = ret.deleted ?? false;
    ret.deletedTimestamp = ret.deleted ? (new Date()).toISOString() : undefined;
    ret.editHistory = ret.editHistory ?? [];
    if (ret.type === 19) {
        ret.message_reference = message.message_reference || message.messageReference;
        if (ret.message_reference) {
            if (message.referenced_message) {
                ret.referenced_message = cleanupMessage(message.referenced_message) as ReferencedMessage;
            } else if (MessageStore.getMessage(ret.message_reference.channel_id, ret.message_reference.message_id)) {
                ret.referenced_message = cleanupMessage(MessageStore.getMessage(ret.message_reference.channel_id, ret.message_reference.message_id)) as ReferencedMessage;
            }
        }
    }

    return ret;
}

export function cleanUpCachedMessage(message: any) {
    const ret = cleanupMessage(message, false);
    ret.ourCache = true;
    return ret;
}

// stolen from MessageLoggerV2
export function cleanupEmbed(embed) {
    /* backported code from the MessageLoggerV2 rewrite */
    if (!embed.id) return embed; /* already cleaned */
    const retEmbed: any = {};
    if (typeof embed.rawTitle === "string") retEmbed.title = embed.rawTitle;
    if (typeof embed.rawDescription === "string") retEmbed.description = embed.rawDescription;
    if (typeof embed.referenceId !== "undefined") retEmbed.reference_id = embed.referenceId;
    // if (typeof embed.color === "string") retEmbed.color = ZeresPluginLibrary.ColorConverter.hex2int(embed.color);
    if (typeof embed.type !== "undefined") retEmbed.type = embed.type;
    if (typeof embed.url !== "undefined") retEmbed.url = embed.url;
    if (typeof embed.provider === "object") retEmbed.provider = { name: embed.provider.name, url: embed.provider.url };
    if (typeof embed.footer === "object") retEmbed.footer = { text: embed.footer.text, icon_url: embed.footer.iconURL, proxy_icon_url: embed.footer.iconProxyURL };
    if (typeof embed.author === "object") retEmbed.author = { name: embed.author.name, url: embed.author.url, icon_url: embed.author.iconURL, proxy_icon_url: embed.author.iconProxyURL };
    if (typeof embed.timestamp === "object" && embed.timestamp._isAMomentObject) retEmbed.timestamp = embed.timestamp.milliseconds();
    if (typeof embed.thumbnail === "object") {
        if (typeof embed.thumbnail.proxyURL === "string" || (typeof embed.thumbnail.url === "string" && !embed.thumbnail.url.endsWith("?format=jpeg"))) {
            retEmbed.thumbnail = {
                url: embed.thumbnail.url,
                proxy_url: typeof embed.thumbnail.proxyURL === "string" ? embed.thumbnail.proxyURL.split("?format")[0] : undefined,
                width: embed.thumbnail.width,
                height: embed.thumbnail.height
            };
        }
    }
    if (typeof embed.image === "object") {
        retEmbed.image = {
            url: embed.image.url,
            proxy_url: embed.image.proxyURL,
            width: embed.image.width,
            height: embed.image.height
        };
    }
    if (typeof embed.video === "object") {
        retEmbed.video = {
            url: embed.video.url,
            proxy_url: embed.video.proxyURL,
            width: embed.video.width,
            height: embed.video.height
        };
    }
    if (Array.isArray(embed.fields) && embed.fields.length) {
        retEmbed.fields = embed.fields.map(e => ({ name: e.rawName, value: e.rawValue, inline: e.inline }));
    }
    return retEmbed;
}

// stolen from MessageLoggerV2
export function cleanupUserObject(user: User) {
    /* backported from the MessageLoggerV2 rewrite */
    return {
        discriminator: user.discriminator,
        username: user.username,
        avatar: user.avatar,
        id: user.id,
        bot: user.bot,
        public_flags: typeof user.publicFlags !== "undefined" ? user.publicFlags : (user as any).public_flags
    };
}
