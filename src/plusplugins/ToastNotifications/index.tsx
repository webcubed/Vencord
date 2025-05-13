/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findStore } from "@webpack";
import { Button, ChannelStore, GuildStore, NavigationRouter, RelationshipStore, SelectedChannelStore, UserStore } from "@webpack/common";
import { Channel, Message, User } from "discord-types/general";
import { ReactNode } from "react";

import { NotificationData, showNotification } from "./components/Notifications";
import { MessageTypes, RelationshipType, StreamingTreatment } from "./types";

let ignoredUsers: string[] = [];
let notifyFor: string[] = [];

// Functional variables.
const MuteStore = findByPropsLazy("isSuppressEveryoneEnabled");
const SelectedChannelActionCreators = findByPropsLazy("selectPrivateChannel");
const UserUtils = findByPropsLazy("getGlobalName");

// Adjustable variables.
const USER_MENTION_REGEX = /<@!?(\d{17,20})>|<#(\d{17,20})>|<@&(\d{17,20})>/g; // This regex captures user, channel, and role mentions.

export const settings = definePluginSettings({
    position: {
        type: OptionType.SELECT,
        description: "The position of the toast notification",
        options: [
            {
                label: "Bottom Left",
                value: "bottom-left",
                default: true
            },
            {
                label: "Top Left",
                value: "top-left"
            },
            {
                label: "Top Right",
                value: "top-right"
            },
            {
                label: "Bottom Right",
                value: "bottom-right"
            },
        ]
    },
    timeout: {
        type: OptionType.SLIDER,
        description: "Time in seconds notifications will be shown for",
        default: 5,
        markers: makeRange(1, 15, 1)
    },
    opacity: {
        type: OptionType.SLIDER,
        description: "Opacity of notifications",
        default: 100,
        markers: makeRange(10, 100, 10)
    },
    maxNotifications: {
        type: OptionType.SLIDER,
        description: "Maximum number of notifications displayed at once",
        default: 3,
        markers: makeRange(1, 5, 1)
    },
    determineServerNotifications: {
        type: OptionType.BOOLEAN,
        description: "Automatically determine which server notifications to show based on your channel/guild settings",
        default: true
    },
    disableInStreamerMode: {
        type: OptionType.BOOLEAN,
        description: "Disable notifications while in streamer mode",
        default: true
    },
    renderImages: {
        type: OptionType.BOOLEAN,
        description: "Render images in notifications",
        default: true
    },
    directMessages: {
        type: OptionType.BOOLEAN,
        description: "Show notifications for direct messages",
        default: true
    },
    groupMessages: {
        type: OptionType.BOOLEAN,
        description: "Show notifications for group messages",
        default: true
    },
    friendServerNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications when friends send messages in servers they share with you",
        default: true
    },
    friendActivity: {
        type: OptionType.BOOLEAN,
        description: "Show notifications for adding someone or receiving a friend request",
        default: true
    },
    streamingTreatment: {
        type: OptionType.SELECT,
        description: "How to treat notifications while sharing your screen",
        options: [
            {
                label: "Normal - Show notifications as normal",
                value: StreamingTreatment.NORMAL,
                default: true
            },
            {
                label: "No Content - Hide notifications body",
                value: StreamingTreatment.NO_CONTENT
            },
            {
                label: "Ignore - Don't show notifications at all",
                value: StreamingTreatment.IGNORE
            }
        ]
    },
    notifyFor: {
        type: OptionType.STRING,
        description: "Create a list of channel IDs to receive notifications from (separate with commas)",
        onChange: () => { notifyFor = stringToList(settings.store.notifyFor); },
        default: ""
    },
    ignoreUsers: {
        type: OptionType.STRING,
        description: "Create a list of user IDs to not receive notifications from (separate with commas)",
        onChange: () => { ignoredUsers = stringToList(settings.store.ignoreUsers); },
        default: ""
    },
    exampleButton: {
        type: OptionType.COMPONENT,
        description: "Show an example toast notification",
        component: () =>
            <Button onClick={showExampleNotification}>
                Show Example Notification
            </Button>
    }
});

function stringToList(str: string): string[] {
    if (str !== "") {
        const array: string[] = [];
        const string = str.replace(/\s/g, "");
        const splitArray = string.split(",");
        splitArray.forEach(id => {
            array.push(id);
        });

        return array;
    }
    return [];
}

function limitMessageLength(body: string, hasAttachments: boolean): string {
    if (hasAttachments) {
        if (body?.length > 30) {
            return body.substring(0, 27) + "...";
        }
    }

    if (body?.length > 165) {
        return body.substring(0, 162) + "...";
    }

    return body;
}

function getName(user: User): string {
    return RelationshipStore.getNickname(user.id) ?? UserUtils.getName(user);
}

const addMention = (id: string, type: string, guildId?: string): ReactNode => {
    let name;
    if (type === "user")
        name = `@${UserStore.getUser(id)?.username || "unknown-user"}`;
    else if (type === "channel")
        name = `#${ChannelStore.getChannel(id)?.name || "unknown-channel"}`;
    else if (type === "role" && guildId)
        name = `@${GuildStore.getGuild(guildId).getRole(id)?.name || "unknown-role"}`;

    // Return the mention as a styled span.
    return (
        <span key={`${type}-${id}`} className={"toastnotifications-mention-class"}>
            {name}
        </span>
    );
};

export default definePlugin({
    name: "ToastNotifications",
    description: "Receive in-app notifications",
    authors: [{ name: "Skully", id: 150298098516754432n }, EquicordDevs.Ethan, EquicordDevs.Buzzy],
    settings,
    flux: {
        async MESSAGE_CREATE({ message }: { message: Message; }) {

            const channel: Channel = ChannelStore.getChannel(message.channel_id);
            const currentUser = UserStore.getCurrentUser();

            const isStreaming = findStore("ApplicationStreamingStore").getAnyStreamForUser(UserStore.getCurrentUser()?.id);

            const streamerMode = settings.store.disableInStreamerMode;
            const currentUserStreamerMode = findStore("StreamerModeStore").enabled;

            if (streamerMode && currentUserStreamerMode) return;
            if (isStreaming && settings.store.streamingTreatment === StreamingTreatment.IGNORE) return;

            if (
                (
                    (message.author.id === currentUser.id) // If message is from the user.
                    || (channel.id === SelectedChannelStore.getChannelId()) // If the user is currently in the channel.
                    || (ignoredUsers.includes(message.author.id)) // If the user is ignored.
                )
            ) return;

            if (channel.guild_id) { // If this is a guild message and not a private message.
                handleGuildMessage(message);
                return;
            }

            if (!settings.store.directMessages && channel.isDM() || !settings.store.groupMessages && channel.isGroupDM() || MuteStore.isChannelMuted(null, channel.id)) return;

            // Prepare the notification.
            const Notification: NotificationData = {
                title: getName(message.author),
                icon: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=128`,
                body: message.content,
                attachments: message.attachments?.length,
                richBody: null,
                permanent: false,
                onClick() { SelectedChannelActionCreators.selectPrivateChannel(message.channel_id); }
            };

            const notificationText = message.content?.length > 0 ? message.content : false;
            const richBodyElements: ReactNode[] = [];

            // If this channel is a group DM, include the channel name.
            if (channel.isGroupDM()) {
                let channelName = channel.name?.trim() ?? false;
                if (!channelName) { // If the channel doesn't have a set name, use the first 3 recipients.
                    channelName = channel.rawRecipients.slice(0, 3).map(e => e.username).join(", ");
                }

                // Finally, truncate the channel name if it's too long.
                const truncatedChannelName = channelName?.length > 20 ? channelName.substring(0, 20) + "..." : channelName;
                Notification.title = `${message.author.username} (${truncatedChannelName})`;
            }
            else if (channel.guild_id) // If this is a guild message and not a private message.
            {
                Notification.title = `${getName(message.author)} (#${channel.name})`;
            }

            // Handle specific message types.
            switch (message.type) {
                case MessageTypes.CALL: {
                    Notification.body = "Started a call with you!";
                    break;
                }
                case MessageTypes.CHANNEL_RECIPIENT_ADD: {
                    const actor = UserStore.getUser(message.author.id);
                    const user = message.mentions[0];
                    const targetUser = UserStore.getUser((user as any).id);

                    Notification.body = `${getName(targetUser)} was added to the group by ${getName(actor)}.`;
                    break;
                }
                case MessageTypes.CHANNEL_RECIPIENT_REMOVE: {
                    const actor = UserStore.getUser(message.author.id);
                    const user = message.mentions[0];
                    const targetUser = UserStore.getUser((user as any).id);

                    if (actor.id !== targetUser.id) {
                        Notification.body = `${getName(targetUser)} was removed from the group by ${getName(actor)}.`;
                    } else {
                        Notification.body = "Left the group.";
                    }
                    break;
                }
                case MessageTypes.CHANNEL_NAME_CHANGE: {
                    Notification.body = `Changed the channel name to '${message.content}'.`;
                    break;
                }
                case MessageTypes.CHANNEL_ICON_CHANGE: {
                    Notification.body = "Changed the channel icon.";
                    break;
                }
                case MessageTypes.CHANNEL_PINNED_MESSAGE: {
                    Notification.body = "Pinned a message.";
                    break;
                }
            }

            // Message contains an embed.
            if (message.embeds?.length !== 0) {
                Notification.body = notificationText || "Sent an embed.";
            }

            // Message contains a sticker.
            if (message?.stickerItems) {
                Notification.body = notificationText || "Sent a sticker.";
            }

            // Message contains an attachment.
            if (message.attachments?.length !== 0) {
                const images = message.attachments.filter(e => typeof e?.content_type === "string" && e?.content_type.startsWith("image"));
                // Label the notification with the attachment type.
                if (images?.length !== 0) {
                    Notification.body = notificationText || ""; // Dont show any body
                    Notification.image = images[0].url;
                } else {
                    Notification.body += ` [Attachment: ${message.attachments[0].filename}]`;
                }
            }

            // TODO: Format emotes properly.
            const matches = Notification.body.match(new RegExp("(<a?:\\w+:\\d+>)", "g"));
            if (matches) {
                for (const match of matches) {
                    Notification.body = Notification.body.replace(new RegExp(`${match}`, "g"), `:${match.split(":")[1]}:`);
                }
            }

            // Replace any mention of users, roles and channels.
            if (message.mentions?.length !== 0 || message.mentionRoles?.length > 0) {
                let lastIndex = 0;
                Notification.body.replace(USER_MENTION_REGEX, (match, userId, channelId, roleId, offset) => {
                    richBodyElements.push(Notification.body.slice(lastIndex, offset));

                    // Add the mention itself as a styled span.
                    if (userId) {
                        richBodyElements.push(addMention(userId, "user"));
                    } else if (channelId) {
                        richBodyElements.push(addMention(channelId, "channel"));
                    } else if (roleId) {
                        richBodyElements.push(addMention(roleId, "role", channel.guild_id));
                    }

                    lastIndex = offset + match?.length;
                    return match; // This value is not used but is necessary for the replace function
                });
            }

            if (richBodyElements?.length > 0) {
                const MyRichBodyComponent = () => <>{richBodyElements}</>;
                Notification.richBody = <MyRichBodyComponent />;
            }

            Notification.body = limitMessageLength(Notification.body, Notification.attachments > 0);

            if (isStreaming && settings.store.streamingTreatment === StreamingTreatment.NO_CONTENT) {
                Notification.body = "Message content has been redacted.";
            }

            if (!settings.store.renderImages) {
                Notification.icon = undefined;
            }

            showNotification(Notification);
        },

        async RELATIONSHIP_ADD({ relationship }) {
            if (ignoredUsers.includes(relationship.user.id)) return;
            relationshipAdd(relationship.user, relationship.type);
        }
    },

    start() {
        ignoredUsers = stringToList(settings.store.ignoreUsers);
        notifyFor = stringToList(settings.store.notifyFor);
    }
});

function switchChannels(guildId: string | null, channelId: string) {
    if (!ChannelStore.hasChannel(channelId)) return;
    NavigationRouter.transitionTo(`/channels/${guildId ?? "@me"}/${channelId}/`);
}

enum NotificationLevel {
    ALL_MESSAGES = 0,
    ONLY_MENTIONS = 1,
    NO_MESSAGES = 2
}

function findNotificationLevel(channel: Channel): NotificationLevel {
    const store = findStore("UserGuildSettingsStore");
    const userGuildSettings = store.getAllSettings().userGuildSettings[channel.guild_id];

    if (!settings.store.determineServerNotifications || MuteStore.isGuildOrCategoryOrChannelMuted(channel.guild_id, channel.id)) {
        return NotificationLevel.NO_MESSAGES;
    }

    if (userGuildSettings) {
        const channelOverrides = userGuildSettings.channel_overrides?.[channel.id];
        const guildDefault = userGuildSettings.message_notifications;

        // Check if channel overrides exist and are in the expected format
        if (channelOverrides && typeof channelOverrides === "object" && "message_notifications" in channelOverrides) {
            return channelOverrides.message_notifications;
        }

        // Check if guild default is in the expected format
        if (typeof guildDefault === "number") {
            return guildDefault;
        }
    }

    // Return a default value if no valid overrides or guild default is found
    return NotificationLevel.NO_MESSAGES;
}

async function handleGuildMessage(message: Message) {
    const c = ChannelStore.getChannel(message.channel_id);
    const notificationLevel: number = findNotificationLevel(c);
    let t = false;
    // 0: All messages 1: Only mentions 2: No messages
    // todo: check if the user who sent it is a friend
    const all = notifyFor.includes(message.channel_id);
    const friend = settings.store.friendServerNotifications && RelationshipStore.isFriend(message.author.id);



    if (!all && !friend) {
        t = true;
        const isMention: boolean = message.content.includes(`<@${UserStore.getCurrentUser().id}>`);
        const meetsMentionCriteria = notificationLevel !== NotificationLevel.ALL_MESSAGES && !isMention;

        if (notificationLevel === NotificationLevel.NO_MESSAGES || meetsMentionCriteria) return;
    }

    const channel: Channel = ChannelStore.getChannel(message.channel_id);

    const notificationText = message.content.length > 0 ? message.content : false;
    const richBodyElements: React.ReactNode[] = [];

    // Prepare the notification.
    const Notification: NotificationData = {
        title: `${getName(message.author)} (#${channel.name})`,
        icon: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=128`,
        body: message.content,
        attachments: message.attachments?.length,
        richBody: null,
        permanent: false,
        onClick() { switchChannels(channel.guild_id, channel.id); }
    };

    if (message.embeds?.length !== 0) {
        Notification.body = notificationText || "Sent an embed.";
    }

    // Message contains a sticker.
    if (message?.stickerItems) {
        Notification.body = notificationText || "Sent a sticker.";
    }

    // Message contains an attachment.
    if (message.attachments?.length !== 0) {
        const images = message.attachments.filter(e => typeof e?.content_type === "string" && e?.content_type.startsWith("image"));
        // Label the notification with the attachment type.
        if (images?.length !== 0) {
            Notification.body = notificationText || ""; // Dont show any body
            Notification.image = images[0].url;
        } else {
            Notification.body += ` [Attachment: ${message.attachments[0].filename}]`;
        }
    }

    // TODO: Format emotes properly.
    const matches = Notification.body.match(new RegExp("(<a?:\\w+:\\d+>)", "g"));
    if (matches) {
        for (const match of matches) {
            Notification.body = Notification.body.replace(new RegExp(`${match}`, "g"), `:${match.split(":")[1]}:`);
        }
    }

    // Replace any mention of users, roles and channels.
    if (message.mentions?.length !== 0 || message.mentionRoles?.length > 0) {
        let lastIndex = 0;
        Notification.body.replace(USER_MENTION_REGEX, (match, userId, channelId, roleId, offset) => {
            richBodyElements.push(Notification.body.slice(lastIndex, offset));

            // Add the mention itself as a styled span.
            if (userId) {
                richBodyElements.push(addMention(userId, "user"));
            } else if (channelId) {
                richBodyElements.push(addMention(channelId, "channel"));
            } else if (roleId) {
                richBodyElements.push(addMention(roleId, "role", channel.guild_id));
            }

            lastIndex = offset + match?.length;
            return match; // This value is not used but is necessary for the replace function
        });
    }

    if (richBodyElements?.length > 0) {
        const MyRichBodyComponent = () => <>{richBodyElements}</>;
        Notification.richBody = <MyRichBodyComponent />;
    }

    Notification.body = limitMessageLength(Notification.body, Notification.attachments > 0);

    const isStreaming = findStore("ApplicationStreamingStore").getAnyStreamForUser(UserStore.getCurrentUser()?.id);

    if (isStreaming && settings.store.streamingTreatment === StreamingTreatment.NO_CONTENT) {
        Notification.body = "Message content has been redacted.";
    }

    if (!settings.store.renderImages) {
        Notification.icon = undefined;
    }

    console.log("Notification that went through: " + t);
    await showNotification(Notification);

}

async function relationshipAdd(user: User, type: Number) {
    user = UserStore.getUser(user.id);
    if (!settings.store.friendActivity) return;

    const Notification: NotificationData = {
        title: "",
        icon: user.getAvatarURL(),
        body: "",
        attachments: 0,
    };

    if (!settings.store.renderImages) {
        Notification.icon = undefined;
    }

    if (type === RelationshipType.FRIEND) {
        Notification.title = `${user.username} is now your friend`;
        Notification.body = "You can now message them directly.";
        Notification.onClick = () => switchChannels(null, user.id);


        await showNotification(Notification);

    } else if (type === RelationshipType.INCOMING_REQUEST) {

        Notification.title = `${user.username} has sent you a friend request`;
        Notification.body = "You can accept or decline it in the Friends tab.";
        Notification.onClick = () => switchChannels(null, "");

        await showNotification(Notification);
    }
}

function showExampleNotification(): Promise<void> {
    const Notification: NotificationData = {
        title: "Example notification",
        icon: `https://cdn.discordapp.com/avatars/${UserStore.getCurrentUser().id}/${UserStore.getCurrentUser().avatar}.png?size=128`,
        body: "This is an example toast notification!",
        attachments: 0,
        permanent: false
    };

    if (!settings.store.renderImages) {
        Notification.icon = undefined;
    }
    return showNotification(Notification);
}
