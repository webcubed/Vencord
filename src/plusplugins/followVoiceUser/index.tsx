/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { Menu, React } from "@webpack/common";
import { VoiceState } from "@webpack/types";
import { Channel, User } from "discord-types/general";

type TFollowedUserInfo = {
    lastChannelId: string;
    userId: string;
} | null;

interface UserContextProps {
    channel: Channel;
    user: User;
    guildId?: string;
}

let followedUserInfo: TFollowedUserInfo = null;

const voiceChannelAction = findByPropsLazy("selectVoiceChannel");
const VoiceStateStore = findStoreLazy("VoiceStateStore");
const UserStore = findStoreLazy("UserStore");

const settings = definePluginSettings({
    onlyWhenInVoice: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Only follow the user when you are in a voice channel"
    },
    leaveWhenUserLeaves: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Leave the voice channel when the user leaves. (This can cause you to enter an infinite leave/join loop)"
    }
});

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { channel, user }: UserContextProps) => {
    if (UserStore.getCurrentUser().id === user.id) return;

    const [checked, setChecked] = React.useState(followedUserInfo?.userId === user.id);

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuCheckboxItem
            id="fvu-follow-user"
            label="Follow User"
            checked={checked}
            action={() => {
                if (followedUserInfo?.userId === user.id) {
                    followedUserInfo = null;
                    setChecked(false);
                    return;
                }

                followedUserInfo = {
                    lastChannelId: UserStore.getCurrentUser().id,
                    userId: user.id
                };
                setChecked(true);
            }}
        ></Menu.MenuCheckboxItem>
    );
};


export default definePlugin({
    name: "FollowVoiceUser",
    description: "Follow someone into voice channels",
    authors: [{ name: "TheArmagan", id: 707309693449535599n }],
    settings,
    flux: {
        async VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            if (!followedUserInfo) return;

            if (
                settings.store.onlyWhenInVoice
                && VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser().id) === null
            ) return;

            voiceStates.forEach(voiceState => {
                if (
                    voiceState.userId === followedUserInfo!.userId
                    && voiceState.channelId
                    && voiceState.channelId !== followedUserInfo!.lastChannelId
                ) {
                    followedUserInfo!.lastChannelId = voiceState.channelId;
                    voiceChannelAction.selectVoiceChannel(followedUserInfo!.lastChannelId);
                } else if (
                    voiceState.userId === followedUserInfo!.userId
                    && !voiceState.channelId
                    && settings.store.leaveWhenUserLeaves
                ) {
                    voiceChannelAction.selectVoiceChannel(null);
                }
            });
        }
    },
    contextMenus: {
        "user-context": UserContextMenuPatch
    }
});
