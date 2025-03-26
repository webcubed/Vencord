/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { addMessagePopoverButton, removeMessagePopoverButton } from "@api/MessagePopover";
import ErrorBoundary from "@components/ErrorBoundary";
import { classes } from "@utils/misc";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { findByProps, findComponentByCodeLazy } from "@webpack";
import { ChannelStore, Menu } from "@webpack/common";
import { Message } from "discord-types/general";

import { Popover as NoteButtonPopover, Popover } from "./components/icons/NoteButton";
import { NoteModal } from "./components/modals/Notebook";
import noteHandler, { noteHandlerCache } from "./NoteHandler";
import { DataStoreToCache, HolyNoteStore } from "./utils";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_TOP:", '.iconBadge,"top"');

const messageContextMenuPatch: NavContextMenuPatchCallback = async (children, { message }: { message: Message; }) => {
    children.push(
        <Menu.MenuItem label="Add Message To" id="add-message-to-note">
            {Object.keys(noteHandler.getAllNotes()).map((notebook: string, index: number) => (
                <Menu.MenuItem
                    key={notebook}
                    label={notebook}
                    id={notebook}
                    action={() => noteHandler.addNote(message, notebook)}
                />
            ))}
        </Menu.MenuItem>
    );
};

function ToolBarHeader() {
    const iconClasses = findByProps("iconWrapper", "clickable");

    return (
        <ErrorBoundary noop={true}>
            <HeaderBarIcon
                tooltip="Holy Notes"
                position="bottom"
                className={classes("vc-note-button", iconClasses.iconWrapper, iconClasses.clickable)}
                icon={e => Popover(e)}
                onClick={() => openModal(props => <NoteModal {...props} />)}
            />
        </ErrorBoundary>
    );
}


export default definePlugin({
    name: "HolyNotes",
    description: "Holy Notes allows you to save messages",
    authors: [{ id: 347096063569559553n, name: "wolfieeeeeeee" }],
    dependencies: ["MessagePopoverAPI", "ChatInputButtonAPI"],

    patches: [
        {
            find: "toolbar:function",
            replacement: {
                match: /(function \i\(\i\){)(.{1,200}toolbar.{1,100}mobileToolbar)/,
                replace: "$1$self.toolbarAction(arguments[0]);$2"
            }
        }
    ],

    toolboxActions: {
        async "Open Notes"() {
            openModal(props => <NoteModal {...props} />);
        }
    },

    contextMenus: {
        "message": messageContextMenuPatch
    },

    toolbarAction(e) {
        if (Array.isArray(e.toolbar))
            return e.toolbar.push(
                <ErrorBoundary noop={true}>
                    <ToolBarHeader />
                </ErrorBoundary>
            );

        e.toolbar = [
            <ErrorBoundary noop={true} key={"HolyNotes"}>
                <ToolBarHeader />
            </ErrorBoundary>,
            e.toolbar,
        ];
    },
    async start() {
        if (await DataStore.keys(HolyNoteStore).then(keys => !keys.includes("Main"))) return noteHandler.newNoteBook("Main");
        if (!noteHandlerCache.has("Main")) await DataStoreToCache();

        addMessagePopoverButton("HolyNotes", message => {
            return {
                label: "Save Note",
                icon: NoteButtonPopover,
                message: message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => noteHandler.addNote(message, "Main")

            };
        });
    },

    async stop() {
        removeMessagePopoverButton("HolyNotes");
    }
});
