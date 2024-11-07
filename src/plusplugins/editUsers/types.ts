/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GuildMember } from "discord-types/general";

export interface ClientUser {
    id: string;
    discriminator: string;
    globalName: string;
    guildMemberAvatars: string[];
    username: string;
}

export interface userChange {
    member?: Partial<GuildMember>;
    user?: Partial<ClientUser>;
    messageAuthor?: Partial<MessageAuthor>;
}

export interface MessageAuthor {
    colorRoleName?: string;
    colorString?: string;
    guildMemberAvatar?: string;
    iconRoleId?: string;
    nick?: string;
}
