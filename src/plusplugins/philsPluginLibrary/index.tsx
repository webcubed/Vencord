/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";


const plugin = definePlugin({
    name: "PhilsPluginLibrary",
    description: "A library for phil's plugins",
    authors: [Devs.phil],
    patches: [
        {
            find: "Unknown frame rate",
            replacement: [
                {
                    match: /(switch\((.{0,10})\).{0,1000})(throw Error\(.{0,100}?Unknown resolution.{0,100}?\))(?=})/,
                    replace: "$1return $2"
                },
                {
                    match: /(switch\((.{0,10})\).{0,1000})(throw Error\(.{0,100}?Unknown frame rate.{0,100}?\))(?=})/,
                    replace: "$1return $2"
                }
            ]
        }
    ]
});


export default plugin;

export * from "./components";
export * from "./discordModules";
export * from "./emitter";
export * from "./icons";
export * from "./patchers";
export * from "./patches";
export * from "./store";
export * as types from "./types";
export * from "./utils";
