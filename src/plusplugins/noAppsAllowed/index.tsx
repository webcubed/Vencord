/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoAppsAllowed",
    description: "Returns the bot's tag :skulk:",
    authors: [{ name: "kvba", id: 105170831130234880n }],

    patches: [
        {
            find: "#{intl::APP_TAG})",
            replacement: {
                match: /\i\.\i\.string\(\i\.\i#{intl::APP_TAG}\)/,
                replace: '"BOT"'
            }
        }
    ],

});
