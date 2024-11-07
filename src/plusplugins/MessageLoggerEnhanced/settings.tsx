/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { OptionType } from "@utils/types";
import { Alerts, Button } from "@webpack/common";
import { Settings } from "Vencord";

import { Native } from ".";
import { openLogModal } from "./components/LogsModal";
import { ImageCacheDir, LogsDir } from "./components/settings/FolderSelectInput";
import { openUpdaterModal } from "./components/UpdaterModal";
import { clearMessagesIDB } from "./db";
import { DEFAULT_IMAGE_CACHE_DIR } from "./utils/constants";
import { exportLogs, importLogs } from "./utils/settingsUtils";

export const settings = definePluginSettings({
    checkForUpdate: {
        type: OptionType.COMPONENT,
        description: "Check for update",
        component: () =>
            <Button onClick={() => openUpdaterModal()}>
                Check For Updates
            </Button>
    },
    saveMessages: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Whether to save the deleted and edited messages.",
    },

    saveImages: {
        type: OptionType.BOOLEAN,
        description: "Save deleted attachments.",
        default: false
    },

    sortNewest: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Sort logs by newest.",
    },

    cacheMessagesFromServers: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Usually MessageLogger(Enhanced) only logs from whitelisted IDs and DMs. Enabling this will make MessageLogger(Enhanced) log messages from all servers as well. Note that this may cause the cache to exceed its limit, resulting in some messages being missed. If you are in a lot of servers, this may significantly increase the chances of messages being logged, which results in a large message record and the inclusion of irrelevant messages.",
    },

    autoCheckForUpdates: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Automatically check for updates on startup.",
    },

    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Whether to ignore messages sent by bots.",
        default: false,
        onChange() {
            // we will be handling the ignoreBots now (enabled or not) so the original MessageLogger shouldn't
            Settings.plugins.MessageLogger.ignoreBots = false;
        }
    },

    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "Whether to ignore messages sent by yourself.",
        default: false,
        onChange() {
            Settings.plugins.MessageLogger.ignoreSelf = false;
        }
    },

    ignoreMutedGuilds: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Messages in muted guilds will not be logged. Whitelisted users/channels in muted guilds will still be logged."
    },

    ignoreMutedCategories: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Messages in channels belonging to muted categories will not be logged. Whitelisted users/channels in muted guilds will still be logged."
    },

    ignoreMutedChannels: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Messages in muted channels will not be logged. Whitelisted users/channels in muted guilds will still be logged."
    },

    alwaysLogDirectMessages: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Always log DMs.",
    },

    alwaysLogCurrentChannel: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Always log the currently selected channel. Blacklisted channels/users will still be ignored.",
    },

    permanentlyRemoveLogByDefault: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Vencord's base MessageLogger remove log button will delete logs permanently.",
    },

    hideMessageFromMessageLoggers: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "When enabled, a button will be added to the context menu of messages that will allow you to delete the specified message without them being logged by other loggers. This might not be safe, so use it at your own risk."
    },

    ShowLogsButton: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "Whether to show a button to open the logs.",
        restartNeeded: true,
    },

    messagesToDisplayAtOnceInLogs: {
        default: 100,
        type: OptionType.NUMBER,
        description: "The number of messages to display at once in the logs & the number of messages to load when loading more messages in the logs.",
    },

    hideMessageFromMessageLoggersDeletedMessage: {
        default: "redacted eh",
        type: OptionType.STRING,
        description: "The message content to replace the message with when using the \"Hide Message From Message Loggers\" feature.",
    },

    messageLimit: {
        default: 200,
        type: OptionType.NUMBER,
        description: "The maximum number of messages to save. Older messages are deleted when the limit is reached. 0 means there is no limit."
    },

    attachmentSizeLimitInMegabytes: {
        default: 12,
        type: OptionType.NUMBER,
        description: "The maximum size (in megabytes) of an attachment to save. Attachments larger than this size will not be saved."
    },

    attachmentFileExtensions: {
        default: "png,jpg,jpeg,gif,webp,mp4,webm,mp3,ogg,wav",
        type: OptionType.STRING,
        description: "A comma-separated list of file extensions to save. Attachments with file extensions not in this list will not be saved. Leave empty to save all attachments."
    },

    cacheLimit: {
        default: 1000,
        type: OptionType.NUMBER,
        description: "The maximum number of messages to store in cache. Older messages are deleted when the limit is reached. This helps reduce memory usage and improve performance. 0 means there is no limit.",
    },

    whitelistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "Whitelisted server, channel and/or user IDs."
    },

    blacklistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "Blacklisted server, channel and/or user IDs."
    },

    imageCacheDir: {
        type: OptionType.COMPONENT,
        description: "Saved images directory",
        component: ErrorBoundary.wrap(ImageCacheDir) as any
    },

    logsDir: {
        type: OptionType.COMPONENT,
        description: "Logs directory",
        component: ErrorBoundary.wrap(LogsDir) as any
    },

    importLogs: {
        type: OptionType.COMPONENT,
        description: "Import Logs From File",
        component: () =>
            <Button onClick={importLogs}>
                Import Logs
            </Button>
    },

    exportLogs: {
        type: OptionType.COMPONENT,
        description: "Export Logs From IndexedDB",
        component: () =>
            <Button onClick={exportLogs}>
                Export Logs
            </Button>
    },

    openLogs: {
        type: OptionType.COMPONENT,
        description: "Open Logs",
        component: () =>
            <Button onClick={() => openLogModal()}>
                Open Logs
            </Button>
    },
    openImageCacheFolder: {
        type: OptionType.COMPONENT,
        description: "Open the image cache directory",
        component: () =>
            <Button
                disabled={
                    IS_WEB
                    || settings.store.imageCacheDir == null
                    || settings.store.imageCacheDir === DEFAULT_IMAGE_CACHE_DIR
                }
                onClick={() => Native.showItemInFolder(settings.store.imageCacheDir)}
            >
                Open Image Cache Folder
            </Button>
    },

    clearLogs: {
        type: OptionType.COMPONENT,
        description: "Clear Logs",
        component: () =>
            <Button
                color={Button.Colors.RED}
                onClick={() => Alerts.show({
                    title: "Clear Logs",
                    body: "Are you sure you want to clear all logs?",
                    confirmColor: Button.Colors.RED,
                    confirmText: "Clear",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        clearMessagesIDB();
                    },
                })}
            >
                Clear Logs
            </Button>
    },

});
