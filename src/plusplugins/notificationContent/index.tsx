/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    mode: {
        description: "Content to show",
        type: OptionType.SELECT,
        options: [
            {
                label: "Name and content",
                value: 0,
                default: true,
            },
            {
                label: "Name only",
                value: 1,
            },
            {
                label: "No name or content",
                value: 2,
            },
        ],
    },
});

export default definePlugin({
    name: "NotificationContent",
    description: "Customize notification content",
    authors: [{ name: "slonkazoid", id: 276363003270791168n }],
    settings,

    process(
        icon: string,
        title: string,
        body: string
    ): { icon?: string; title: string; body: string } {
        return {
            icon: settings.store.mode !== 2 ? icon : undefined,
            title: settings.store.mode !== 2 ? title : "Discord",
            body: settings.store.mode === 0 ? body : "New message",
        };
    },

    patches: [
        {
            find: "showNotification:function",
            replacement: {
                match: /(showNotification:function\((\i),(\i),(\i),\i,\i\){)/,
                replace:
                    "$1let processed = $self.process($2, $3, $4); $2 = processed.icon; $3 = processed.title; $4 = processed.body;",
            },
        },
    ],
});
