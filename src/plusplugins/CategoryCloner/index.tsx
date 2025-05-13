/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { showNotification } from "@api/Notifications";
import { CopyIcon } from "@components/Icons";
import { getIntlMessage } from "@utils/discord";
import definePlugin from "@utils/types";
import { ChannelStore, Constants, Menu, PermissionsBits, PermissionStore, RestAPI } from "@webpack/common";

interface CategoryChannel {
    name: string;
    type: number;
    permissionOverwrites_: any[];
}

async function CloneCategory(guildId: string, data: CategoryChannel) {
    const { name, type, permissionOverwrites_ } = data;

    await RestAPI.post({
        url: Constants.Endpoints.GUILD_CHANNELS(guildId),
        body: {
            name,
            type,
            permission_overwrites: Object.values(permissionOverwrites_)
        }
    });

    showNotification({
        title: "Clone Category",
        body: "Successfully cloned category"
    });
}

function MakeContextCallback(name: "Channel"): NavContextMenuPatchCallback {
    return (children, props) => {
        const value = props[name.toLowerCase()];
        if (!value) return;
        if (props.label === getIntlMessage("CHANNEL_ACTIONS_MENU_LABEL")) return;
        if (value.type !== 4) return;

        const channel = ChannelStore.getChannel(value.id);
        if (!PermissionStore.can(PermissionsBits.MANAGE_CHANNELS, channel)) return;

        const lastChild = children.at(-1);
        if (lastChild?.key === "developer-actions") {
            const p = lastChild.props;
            if (!Array.isArray(p.children))
                p.children = [p.children];

            children = p.children;
        }

        children.splice(-1, 0,
            <Menu.MenuItem
                id={`vc-clone-category-${name.toLowerCase()}`}
                label="Clone category"
                icon={CopyIcon}
                action={() => CloneCategory(value.guild_id, value)}
            />
        );
    };
}

export default definePlugin({
    name: "Clone Category",
    description: "Adds the ability to clone channel categories",
    authors: [{ name: "mafineeek", id: 854342480019587133n }],
    contextMenus: {
        "channel-context": MakeContextCallback("Channel")
    }
});
