/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { Alerts, Menu } from "@webpack/common";
import { Message } from "discord-types/general";
import { Settings } from "Vencord";

import { registerAction } from "./commandPalette/commands";
import { openSimpleTextInput } from "./commandPalette/components/TextInput";
const DOUBLECOUNTER_APP_ID = "703886990948565003";
const VERIFICATION_LINK_REGEX = /https:\/\/verify.doublecounter.gg\/v\/[0-9a-z]{8,16}/g;

const patchMessageContextMenu: NavContextMenuPatchCallback = (children, { message }) => {
    const { components } = message;

    if (message.author.id === DOUBLECOUNTER_APP_ID && components?.length === 0 && message.embeds?.map(embed => embed)[0].fields.length === 4) {
        children.push((
            <Menu.MenuItem
                id="ml-dcvp"
                key="ml-dcvp-verify"
                label="Bypass Double Counter"
                color="brand"
                action={() => {
                    const regex_link = VERIFICATION_LINK_REGEX.exec(message.embeds.map(embed => embed.fields.map(field => field))[0][1].rawValue);
                    if (regex_link) {
                        verify(regex_link[0]).then(() => {
                            Alerts.show({
                                title: "Verified",
                                body: "You have been verified successfully, please wait a little bit for DoubleCounter to update your roles.",
                                confirmText: "Okay",
                            });
                        });
                    } else {
                        Alerts.show({
                            title: "Link not found",
                            body: "The link has not been found in this message.",
                            confirmText: "Okay"
                        });
                    }
                }}
            />
        ));
    }
};

async function verify(link) {
    try {
        const res = await fetch(link);
        console.log(res.ok);
    } catch { }
}

export default definePlugin({
    name: "DoubleCounterVerifyBypass",
    description: "Bypass Double Counter verifications easily.",
    authors: [],

    contextMenus: {
        "message": patchMessageContextMenu,
    },

    start() {
        if (Settings.plugins.CommandPalette.enabled) {
            registerAction({
                id: "doubleCounterVerify",
                label: "Verify a Double Counter Link",
                callback: async () => {
                    const link = await openSimpleTextInput("Please enter the Double Counter link you want to verify.");
                    if (link) {
                        await verify(link).then(() => {
                            Alerts.show({
                                title: "Verified",
                                body: "You have been verified successfully, please wait a little bit for DoubleCounter to update your roles.",
                                confirmText: "Okay",
                                onConfirm: () => { }
                            });
                        });
                    }
                },
                registrar: "DoubleCounterVerifyBypass"
            });
        }
    },

    flux: {
        async MESSAGE_CREATE({ message }: { message: Message; }) {
            if (message.author.id !== DOUBLECOUNTER_APP_ID || message.type !== 19 || message.embeds.length === 0) return;

            // @ts-ignore
            const link = VERIFICATION_LINK_REGEX.exec(message.embeds.map(embed => embed.fields.map(field => field))[0][1].value);
            console.log(link);
            await verify(link).then(() => {
                Alerts.show({
                    title: "Verified",
                    body: "You have been verified successfully, please wait a little bit for DoubleCounter to update your roles.",
                    confirmText: "Okay",
                    onConfirm: () => { }
                });
            });
        }
    }
});
