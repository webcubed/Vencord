/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoJoinPermission",
    description: "Removes the annoying 'Join servers for you' scope from all authorization links (May cause some applications to break)",
    authors: [{ name: "Pixeluted", id: 1057760003701882890n }],
    patches: [
        {
            find: "No integration type was selected.",
            replacement: {
                match: /(.includes\(\i\)\);)(return{requestedScopes:(\i),accountScopes:(\i)})/,
                replace: "$1$self.handleScopes($3, $4);$2"
            }
        }
    ],

    handleScopes(requestedScopes, accountScopes) {
        for (let i = requestedScopes.length - 1; i >= 0; i--) {
            const scopeName = requestedScopes[i];
            if (scopeName === "guilds.join") {
                requestedScopes.splice(i, 1);
            }
        }

        for (let i = accountScopes.length - 1; i >= 0; i--) {
            const scopeName = accountScopes[i];
            if (scopeName === "guilds.join") {
                accountScopes.splice(i, 1);
            }
        }
    },
});
