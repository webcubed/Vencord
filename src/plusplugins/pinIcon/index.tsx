/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { Icons } from "@webpack/common";
import { Message } from "discord-types/general";

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
            find: "#{intl::MESSAGE_EDITED}),",
            replacement: {
                match: /#{intl::MESSAGE_EDITED}\),(?:[^}]*[}]){3}\)/,
                replace: "$&,$self.PinnedIcon(arguments[0].message)"
            }
        }
    ],
    PinnedIcon({ pinned }: Message) {
        return pinned ? (<Icons.PinIcon size="xs" style={{ position: "absolute", right: "0", top: "0" }} />) : null;
    }
});
