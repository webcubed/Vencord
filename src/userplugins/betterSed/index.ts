/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants.js";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { MessageStore, UserStore } from "@webpack/common";
import { Channel, Message } from "discord-types/general";

const MessageActions = findByPropsLazy("editMessage", "sendMessage");

// this has to be the worst regex i have ever written
const ourRegex = /^(\^*)s\/((?:[^\\/]+?))\/((?:[^\\/]+?))(?:\/([gimsuy]*))?$/;

export default definePlugin({
    name: "BetterSed",
    authors: [Devs.TheSun, Devs.ImLvna],
    description: "Improves Discord's search replacement",
    patches: [{
        find: "/^s\\/((?:.+?)[^\\\\]|.)\\/(.*)/",
        replacement: [{
            match: /(searchReplace:.{1,100},)action\(\i,\i\).+?,spoiler/,
            replace: "$1action:$self.replace},spoiler"
        }, {
            match: /\/\^s\\\/.*\(\.\*\)\//,
            replace: ourRegex.toString()
        }]
    }],

    replace(replacement: string, { channel, isEdit }: { channel: Channel, isEdit: boolean; }) {
        if (isEdit) return;
        console.log(replacement);
        console.log(replacement.match(ourRegex));
        const [_, arrows, find, replace, flags] = replacement.match(ourRegex)!;
        const userId = UserStore.getCurrentUser().id;

        const messages = MessageStore.getMessages(channel.id).toArray().filter(m => m.author.id === userId).reverse();
        const message = messages[arrows.length] as Message;
        if (!message) return { content: "" };

        const matchRegex = new RegExp(find, flags);

        const newContent = message.content.replace(matchRegex, replace);

        if (newContent || message.attachments.length) {
            if (newContent !== message.content) MessageActions.editMessage(channel.id, message.id, {
                content: newContent
            });
        }
        else MessageActions.deleteMessage(channel.id, message.id);

        return { content: "" };
    }
});
