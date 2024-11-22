/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import { replacedUserPanelComponent } from "./patches";

export default definePlugin({
    name: "PhilsPluginLibrary",
    description: "A library for Phil's plugins",
    authors: [
        {
            name: "philhk",
            id: 305288513941667851n
        }
    ],
    patches: [{
        find: "#{intl::ACCOUNT_A11Y_LABEL}",
        replacement: {
            match: /((?:.*)(?<=function) .{0,8}?(?={).)(.{0,1000}#{intl::ACCOUNT_PANEL}.{0,1000}\)]}\))(})/,
            replace: "$1return $self.replacedUserPanelComponent(function(){$2}, this, arguments)$3"
        }
    }, {
        find: "Unknown frame rate",
        replacement: [{
            match: /(switch\((.{0,10})\).{0,1000})(throw Error\(.{0,100}?Unknown resolution.{0,100}?\))(?=})/,
            replace: "$1return $2"
        },
        {
            match: /(switch\((.{0,10})\).{0,1000})(throw Error\(.{0,100}?Unknown frame rate.{0,100}?\))(?=})/,
            replace: "$1return $2"
        }]
    }],
    replacedUserPanelComponent,
});

export * from "./components";
export * from "./discordModules";
export * from "./emitter";
export * from "./icons";
export * from "./patchers";
export * from "./patches";
export * from "./store";
export * as types from "./types";
export * from "./utils";
