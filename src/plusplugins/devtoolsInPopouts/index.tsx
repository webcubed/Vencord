/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "DevtoolsInPopouts",
    description: "Adds React Developer Tools to Discord's popout windows",
    authors: [Devs.sadan],
    patches: [
        {
            find: "discordPopoutEvent",
            replacement: {
                match: /window\.open.*?\)\)(?=,|;)/,
                replace: "$self.wrapReactDevTools($&)"
            }
        }
    ],

    wrapReactDevTools(openedWindow: Window) {
        if (openedWindow?.[Symbol.toStringTag] === "Window")
            Object.defineProperty(openedWindow, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
                configurable: false,
                enumerable: false,
                get() {
                    return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
                }
            });
        else
            console.error("wrapReactDevTools called without a window", openedWindow);
        return openedWindow;
    },
});
