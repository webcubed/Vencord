/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { ChannelStore, GuildStore, UserStore } from "@webpack/common";
import { User } from "discord-types/general";

import VoiceActivityIcon from "./components/VoiceActivityIcon";
import { VoiceChannelSection } from "./components/VoiceChannelSection";

const VoiceStateStore = findStoreLazy("VoiceStateStore");

export const settings = definePluginSettings({
    showInUserProfileModal: {
        type: OptionType.BOOLEAN,
        description: "Show a user's voice channel in their profile modal",
        default: true,
    },
    showVoiceChannelSectionHeader: {
        type: OptionType.BOOLEAN,
        description: 'Whether to show "IN A VOICE CHANNEL" above the join button',
        default: true,
    },
    showVoiceActivityIcons: {
        type: OptionType.BOOLEAN,
        description: "Show a user's voice activity in dm list and member list",
        default: true,
        restartNeeded: true,
    },
    showUsersInVoiceActivity: {
        type: OptionType.BOOLEAN,
        description: "Whether to show a list of users connected to a channel",
        default: true,
        disabled: () => !settings.store.showVoiceActivityIcons
    },
});

interface UserProps {
    user: User;
}

const VoiceChannelField = ErrorBoundary.wrap(({ user }: UserProps) => {
    const { channelId } = VoiceStateStore.getVoiceStateForUser(user.id) ?? {};
    if (!channelId) return null;

    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return null;

    const guild = GuildStore.getGuild(channel.guild_id);

    if (!guild) return null; // When in DM call

    return (
        <VoiceChannelSection
            channel={channel}
            joinDisabled={VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser().id)?.channelId === channelId}
            showHeader={settings.store.showVoiceChannelSectionHeader}
        />
    );
});


export default definePlugin({
    name: "UserVoiceShow",
    description: "Shows users' voice activity information",
    authors: [Devs.LordElias, Devs.Johannes7k75],
    tags: ["voice", "activity"],
    settings,

    patchModal: ErrorBoundary.wrap(({ user }: UserProps) => {
        if (!settings.store.showInUserProfileModal)
            return null;

        return (
            <div className="vc-uvs-modal-margin">
                <VoiceChannelField user={user} />
            </div>
        );
    }, { noop: true }),

    patchPopout: ErrorBoundary.wrap(({ user }: UserProps) => {
        const isSelfUser = user.id === UserStore.getCurrentUser().id;
        return (
            <div className={isSelfUser ? "vc-uvs-popout-margin-self" : ""}>
                <VoiceChannelField user={user} />
            </div>
        );
    }, { noop: true }),

    patchPrivateChannelProfile: ErrorBoundary.wrap(({ user }: UserProps) => {
        if (!user) return null;

        return <div className="vc-uvs-private-channel">
            <VoiceChannelField user={user} />
        </div>;
    }, { noop: true }),

    patchUserList: ({ user }: UserProps, dmList: boolean) => {
        if (!settings.store.showVoiceActivityIcons) return null;

        return (
            <ErrorBoundary noop>
                <VoiceActivityIcon user={user} dmChannel={dmList} />
            </ErrorBoundary>

        );
    },

    patches: [
        // User Profile Modal - below user info
        {
            find: ".popularApplicationCommandIds,",
            replacement: {
                match: /(?<=,)(?=!\i&&!\i&&.{0,50}setNote:)/,
                replace: "$self.patchPopout(arguments[0]),",
            }
        },

        // User Popout Modal - above Notes
        {
            find: ".Messages.MUTUAL_GUILDS_WITH_END_COUNT", // Lazy-loaded
            replacement: {
                match: /\.body.+?displayProfile:\i}\),/,
                // paste my fancy custom button below the username
                replace: "$&$self.patchModal(arguments[0]),",
            }
        },

        // Private Channel Profile - above Activities
        {
            find: "UserProfileTypes.PANEL,useDefaultClientTheme",
            replacement: {
                match: /user:(\i){1,2}.+?voiceGuild,voiceChannel.+?:null,/,
                replace: "$&$self.patchPrivateChannelProfile({user:$1}),"
            }
        },

        // Member List User
        {
            find: ".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)",
            replacement: {
                match: /avatar:(\i){1,2}/,
                replace: "children:[$self.patchUserList(arguments[0], false)],$&",
            }
        },

        // Dm List User
        {
            find: "PrivateChannel.renderAvatar",
            replacement: {
                match: /highlighted:.+?name:.+?decorators.+?\}\)\}\),/,
                replace: "$&$self.patchUserList(arguments[0], true),",
            }
        }
    ],
});
