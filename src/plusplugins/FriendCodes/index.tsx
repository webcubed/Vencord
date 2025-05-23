/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

import FriendCodesPanel from "./components/FriendCodesPanel";

export default definePlugin({
    name: "FriendCodes",
    description: "Generate friend codes/invites to let people easily friend you",
    authors: [{ name: "domi.btnr", id: 354191516979429376n }],
    patches: [
        {
            find: "#{intl::ADD_FRIEND})}),(",
            replacement: {
                match: /header,children:\[.*?\{\}\)/,
                replace: "$&,$self.FriendCodesPanel"
            },
            noWarn: true,
        }
    ],

    get FriendCodesPanel() {
        return <FriendCodesPanel />;
    }
});
