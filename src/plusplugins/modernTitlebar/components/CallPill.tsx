/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CallPill.css";

import { classes, getIntlMessage } from "@utils/index";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { ChannelStore, ContextMenuApi, GuildStore, Icons, Menu, NavigationRouter, RelationshipStore, SelectedChannelStore, UserStore } from "@webpack/common";
import { Channel, User } from "discord-types/general";

import { useCallTimer } from "../utils/callTimer";
import Pill from "./Pill";
import { cl } from "./TitleBar";

const formatChannelName = findByCodeLazy("#{intl::GROUP_DM_ALONE}");
const VoiceChannelActions = findByPropsLazy("selectVoiceChannel", "disconnect");

// Adapted from CallTimer
function formatDuration(ms: number) {
    const format = (n: number) => ("" + n).padStart(2, "0");

    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor(((ms % 86400000) % 3600000) / 60000);
    const s = Math.floor((((ms % 86400000) % 3600000) % 60000) / 1000);

    const list = [h, m, s];
    if (d === 0 && h === 0) list.shift();

    return (d > 0 ? `${d}d ` : "") + list.map(format).join(":");
}

export default function CallPill(props: { user: User | undefined; }) {
    const time = useCallTimer();

    if (time === null || !props.user) return null;
    return <Pill
        action={() => {
            const channelId = SelectedChannelStore.getVoiceChannelId();
            if (!channelId) return;
            const channel = ChannelStore.getChannel(channelId);
            NavigationRouter.transitionToGuild(channel.getGuildId(), channelId);
        }}
        className={cl("call-pill")}
        pillProps={{
            onContextMenu(e) {
                const channel = ChannelStore.getChannel(SelectedChannelStore.getVoiceChannelId()!);
                ContextMenuApi.openContextMenu(e, () => <CallPillContextMenu channel={channel} />);
            }
        }}
    >
        <Icons.PhoneCallIcon size="xs" color="currentColor" />
        <span className={classes(cl("pill-content"), cl("call-pill-content"))}>{formatDuration(time!)}</span>
    </Pill>;
}

export function CallPillContextMenu({ channel }: { channel: Channel; }) {
    const guild = GuildStore.getGuild(channel.getGuildId());
    return <Menu.Menu
        navId="vc-modernTitlebar-call-pill-menu"
        onClose={ContextMenuApi.closeContextMenu}
    >
        <Menu.MenuGroup label="Current Call">
            <Menu.MenuItem
                id="current-channel"
                label={formatChannelName(channel, UserStore, RelationshipStore)}
                subtext={guild?.name}
                action={() => NavigationRouter.transitionToGuild(channel.getGuildId(), channel.id)}
            />
        </Menu.MenuGroup>
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="disconnect"
                color="danger"
                label={getIntlMessage("DISCONNECT_SELF")}
                action={() => {
                    VoiceChannelActions.disconnect();
                }}
            />
        </Menu.MenuGroup>
    </Menu.Menu>;
}
