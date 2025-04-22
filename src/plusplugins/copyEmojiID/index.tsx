/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, removeContextMenuPatch } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, React } from "@webpack/common";

interface Emoji {
    type: "emoji",
    id: string,
    name: string;
}

const settings = definePluginSettings({
    formattedString: {
        type: OptionType.BOOLEAN,
        description: "Use a formatted string instead of the emoji's ID",
        default: false
    }
});

export default definePlugin({
    name: "CopyEmojiID",
    description: "Adds a button to copy an emoji's ID",
    authors: [Devs.HappyEnderman, Devs.ANIKEIPS],
    settings,

    expressionPickerPatch(children, props) {
        if (!children.find(element => element.props.id === "copy-emoji-id")) {
            const data = props.target.dataset as Emoji;
            const firstChild = props.target.firstChild as HTMLImageElement;
            const isAnimated = firstChild && new URL(firstChild.src).pathname.endsWith(".gif");
            if (data.type === "emoji" && data.id) {
                children.push((
                    <Menu.MenuItem
                        id="copy-emoji-id"
                        key="copy-emoji-id"
                        label={settings.store.formattedString ? "Copy as formatted string" : "Copy Emoji ID"}
                        action={() => {
                            const formatted_emoji_string = settings.store.formattedString ? `${isAnimated ? "<a:" : "<:"}${data.name}:${data.id}>` : `${data.id}`;
                            copyToClipboard(formatted_emoji_string);
                        }}
                    />
                ));
            }
        }
    },
    start() {
        addContextMenuPatch("expression-picker", this.expressionPickerPatch);
    },
    stop() {
        removeContextMenuPatch("expression-picker", this.expressionPickerPatch);
    }
});
