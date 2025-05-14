/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Message } from "discord-types/general";

const PinIcon = findComponentByCodeLazy("1-.06-.63L6.16");
export default definePlugin({
    name: "PinIcon",
    description: "Adds a pin icon to pinned messages",
    authors: [
        {
            name: "i am me",
            id: 984392761929256980n,
        },
    ],
    patches: [
        {
            find: "isUnsupported})",
            replacement: {
                match: /WITH_CONTENT\}\)/,
                replace: "$&,$self.PinnedIcon(arguments[0].message)"
            }
        }
    ],
    PinnedIcon({ pinned }: Message) {
        return pinned ? (<PinIcon size="xs" style={{ position: "absolute", right: "0", top: "0" }} />) : null;
    }
});
