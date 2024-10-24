/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { disableStyle, enableStyle } from "@api/Styles";
import { Devs } from "@utils/constants";
import { ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { findByCodeLazy } from "@webpack";
import { Menu, Text, TextInput } from "@webpack/common";
import { GuildMember, Message, User } from "discord-types/general";

import style from "./style.css";
import { ClientUser, MessageAuthor, userChange } from "./types";


const EditIcon = findByCodeLazy("M19.2929");



let changes: { [key: string]: userChange; } = {};

const contextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }) => () => {
    children.push(
        <Menu.MenuItem
            id="vc-edit-user"
            label="Edit user"
            action={() => openModal(props => editUserPane(user as unknown as ClientUser, props))}
            icon={EditIcon}
        />
    );
};

interface field {
    label: string;
    default: string;
    value: string;
    edit: (string) => void;
    unset: () => void;
}

function editUserPane(user: ClientUser, props: ModalProps) {
    console.log(user);

    if (!changes[user.id]) {
        changes[user.id] = {
            user: {},
            member: {},
            messageAuthor: {},
        };
    }

    const fields: field[] = [
        {
            label: "Display Name",
            default: user.globalName,
            value: changes[user.id].user?.globalName || user.globalName,
            edit: (value: string) => {
                changes[user.id].user!.globalName = value;
                changes[user.id].messageAuthor!.nick = value;
            },
            unset: () => {
                delete changes[user.id].user!.globalName;
                delete changes[user.id].messageAuthor!.nick;
            }
        }
    ];
    return (
        <ModalRoot {...props} className="edit-user-modal">
            <Text variant="eyebrow" tag="h2">{user.globalName}</Text>
            {fields.map(field => {

                const onChange = (value: string) => {
                    field.value = value;
                    if (value.length === 0 || value === field.default) {
                        field.unset();
                    } else {
                        field.edit(value);
                    }
                    DataStore.set("editUsers", changes);
                };
                return (
                    <div className="edit-user-field">
                        <Text variant="eyebrow" tag="h3">{field.label}</Text>
                        <TextInput defaultValue={field.value} onChange={onChange} />
                    </div>
                );
            })}
        </ModalRoot>
    );
}


export default definePlugin({
    name: "[WIP] EditUsers",
    description: "Adds a button to edit users.",
    authors: [Devs.ImLvna],

    patches: [


        // Message
        {
            find: "Message must not be a thread starter message",
            replacement: {
                match: /(?<=\i=)(\i)\.message(?=,\i=\1\.message\.id)/,
                replace: "$self.patchMessage($1.message)"
            }
        },
        {
            find: ".withMentionPrefix",
            replacement: [
                {
                    match: /var \i,\i=(\i)\.author/,
                    replace: "$1.author = $self.getMessageAuthor($1.author, $1.message.id); $&"
                },
            ]
        },


        // Member List
        {
            find: ".openGuildSubscriptionModal",
            replacement: {
                match: /(?<=\i=)(\i)\.user(?=,\i=\1\.index)/,
                replace: "$self.getUser($1.user)"
            }
        }
    ],


    async start() {
        changes = await DataStore.get("editUsers") || {};
        addContextMenuPatch("user-context", contextMenuPatch);
        enableStyle(style);
    },

    async stop() {
        removeContextMenuPatch("user-context", contextMenuPatch);
        disableStyle(style);
        await DataStore.set("editUsers", changes);
    },

    patchMessage(message: Message) {
        message.author = this.getUser(message.author as unknown as ClientUser) as unknown as User;
        return message;
    },



    getMember(member: GuildMember) {
        if (changes[member.userId]?.member) {
            for (const key in changes[member.userId].member) {
                member[key] = changes[member.userId].member![key];
            }
        }
        return member;
    },
    getUser(author: ClientUser) {
        if (changes[author.id]?.user) {
            for (const key in changes[author.id].user) {
                author[key] = changes[author.id].user![key];
            }
        }
        return author;
    },
    getMessageAuthor(author: MessageAuthor, userId) {
        if (changes[userId]?.messageAuthor) {
            for (const key in changes[userId].messageAuthor) {
                author[key] = changes[userId].messageAuthor![key];
            }
        }
        return author;
    }
});
