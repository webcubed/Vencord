/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { addMessageAccessory, removeMessageAccessory } from "@api/MessageAccessories";
import { addMessagePopoverButton, removeMessagePopoverButton } from "@api/MessagePopover";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, Menu } from "@webpack/common";

import { settings } from "./settings";
import { Accessory, handleTranslate } from "./utils/accessory";
import { Icon } from "./utils/icon";

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }) => {
    if (!message.content) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, (
        <Menu.MenuItem
            id="ec-trans"
            label="Translate"
            icon={Icon}
            action={() => handleTranslate(message)}
        />
    ));
};

export default definePlugin({
    name: "Translate+",
    description: "Vencord's translate plugin, but with support for artistic languages",
    dependencies: ["MessageAccessoriesAPI"],
    authors: [Devs.Ven, EquicordDevs.Prince527],
    settings,
    contextMenus: {
        "message": messageCtxPatch
    },

    start() {
        addMessageAccessory("ec-translation", props => <Accessory message={props.message} />);

        addMessagePopoverButton("ec-translate", message => {
            if (!message.content) return null;

            return {
                label: "Translate",
                icon: Icon,
                message: message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => handleTranslate(message),
            };
        });
    },
    stop() {
        removeMessagePopoverButton("ec-translate");
        removeMessageAccessory("ec-translation");
    }
});
