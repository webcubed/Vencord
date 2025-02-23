/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 nin0dev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { ApplicationCommandInputType, ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId } from "@api/ContextMenu";
import { getUserSettingLazy } from "@api/UserSettings";
import { Devs } from "@utils/constants";
import { getCurrentChannel, getCurrentGuild } from "@utils/discord";
import definePlugin from "@utils/types";
import { Forms, GuildMemberStore, GuildStore, Menu, Parser } from "@webpack/common";
import { Guild, GuildMember } from "discord-types/general";

import { MemberIcon } from "./icons";
import { showInRoleModal } from "./RoleMembersModal";

const DeveloperMode = getUserSettingLazy("appearance", "developerMode")!;

export default definePlugin({
    name: "InRole",
    description: "Know who has a role with the role context menu or /inrole command (read plugin info!)",
    authors: [
        Devs.nin0dev,
        {
            name: "Ryfter",
            id: 898619112350183445n,
        },
        {
            name: "okiso",
            id: 274178934143451137n,
        }
    ],
    dependencies: ["UserSettingsAPI"],
    start() {
        // DeveloperMode needs to be enabled for the context menu to be shown
        DeveloperMode.updateSetting(true);
    },
    settingsAboutComponent: () => {
        return (
            <>
                <Forms.FormText style={{ fontSize: "1.2rem", marginTop: "15px", fontWeight: "bold" }}>{Parser.parse(":warning:")} Limitations</Forms.FormText>
                <Forms.FormText style={{ marginTop: "10px", fontWeight: "500" }} >If you don't have moderator permissions in the server and the server is large (over 100 members), the plugin will be limited in the following ways:</Forms.FormText>
                <Forms.FormText>• Offline members won't be listed, except for friends</Forms.FormText>
                <Forms.FormText>• Up to 100 members will be listed by default (for each role). To get more, scroll down in the member list.</Forms.FormText>
            </>
        );
    },

    commands: [
        {
            name: "inrole",
            description: "Know who has a role",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "role",
                    description: "The role",
                    type: ApplicationCommandOptionType.ROLE,
                    required: true
                },
            ],
            execute: (args, ctx) => {
                // Guild check
                if (!ctx.guild) {
                    return sendBotMessage(ctx.channel.id, { content: "Make sure that you are in a server." });
                }
                const role = args[0].value;
                showInRoleModal(ctx.guild.id, role);
            }
        }
    ],
    contextMenus: {
        "dev-context"(children, { id }: { id: string; }) {
            const guild = getCurrentGuild();
            if (!guild) return;

            const channel = getCurrentChannel();
            if (!channel) return;

            const role = GuildStore.getRole(guild.id, id);
            if (!role) return;

            children.push(
                <Menu.MenuItem
                    id="vc-view-inrole"
                    label="View Members in Role"
                    action={() => {
                        showInRoleModal(getMembersInRole(role.id, guild.id), role.id, channel.id);
                    }}
                    icon={InfoIcon}
                />
            );
        },
        "message"(children, { message }: { message: any; }) {
            const guild = getCurrentGuild();
            if (!guild) return;

            const roleMentions = message.content.match(/<@&(\d+)>/g);
            if (!roleMentions?.length) return;

            const channel = getCurrentChannel();
            if (!channel) return;

            const roleIds = roleMentions.map(mention => mention.match(/<@&(\d+)>/)![1]);

            const role = GuildStore.getRole(guild.id, roleIds);
            if (!role) return;

            children.push(
                <Menu.MenuItem
                    id="vc-view-inrole"
                    label="View Members in Role"
                    action={() => {
                        showInRoleModal(guild.id, role.id);
                    }}
                    icon={MemberIcon}
                />
            );
        },
        "guild-header-popout"(children, { guild }: { guild: Guild, onClose(): void; }) {
            if (!guild) return;
            const group = findGroupChildrenByChildId("privacy", children);
            group?.push(
                <Menu.MenuItem
                    label="View Members in Role"
                    id="inrole-menuitem"
                    icon={MemberIcon}
                    action={() => showInRoleModal(guild.id, "0")}
                />
            );
        }
    }
});
