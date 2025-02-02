/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { proxyLazy } from "@utils/lazy";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Flux, FluxDispatcher, GuildStore } from "@webpack/common";
import { Channel, Guild } from "discord-types/general";

// Can't destructure, otherwise context is lost
const DMChannelHandler = findByPropsLazy("getOrEnsurePrivateChannel");

interface SidebarData {
    isUser: boolean;
    guildId: string;
    id: string;
}

export const SidebarStore = proxyLazy(() => {
    class SidebarStore extends Flux.Store {
        public guild: Guild | null = null;
        public channel: Channel | null = null;
        public width = 0;
    }

    const store = new SidebarStore(FluxDispatcher, {
        // @ts-ignore
        async NEW_SIDEBAR_CHAT({ isUser, guildId, id }: SidebarData) {
            store.guild = guildId ? GuildStore.getGuild(guildId) : null;

            if (!isUser) {
                store.channel = ChannelStore.getChannel(id);
                return;
            }

            const channelId = await DMChannelHandler.getOrEnsurePrivateChannel(id);
            store.channel = ChannelStore.getChannel(channelId);
            store.emitChange();
        },

        CLOSE_SIDEBAR_CHAT() {
            store.guild = null;
            store.channel = null;
        },

        SIDEBAR_CHAT_WIDTH({ width }: { width: number; }) {
            store.width = width;
            store.emitChange();
        }
    });

    return store;
});
