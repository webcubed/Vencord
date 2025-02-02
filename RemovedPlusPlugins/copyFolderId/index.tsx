/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/misc";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu } from "@webpack/common";

export default definePlugin({
    name: "CopyFolderId",
    description: "Adds an option to copy (server) folder IDs",
    authors: [Devs.sadan],

    contextMenus: {
        "guild-context"(arr, { folderId }: { folderId?: number }) {
            if(!folderId) return;

            arr.push((<Menu.MenuItem
                id="vc-copyFolderId"
                label="Copy Folder ID"
                icon={findByPropsLazy("CopyIcon")}
                action={() => {
                    copyWithToast(`${folderId}`);
                }}
            />));
        }
    }
});
