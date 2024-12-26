/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

import { addSettingsPanelButton, Emitter, removeSettingsPanelButton, ScreenshareSettingsIcon } from "../philsPluginLibrary";
import { PluginInfo } from "./constants";
import { openScreenshareModal } from "./modals";
import { ScreenshareAudioPatcher, ScreensharePatcher } from "./patchers";
import { replacedScreenshareModalComponent } from "./patches";
import { initScreenshareAudioStore, initScreenshareStore } from "./stores";

export default definePlugin({
    name: "BetterScreenshare",
    description: "This plugin allows you to further customize your screen sharing.",
    authors: [Devs.phil],
    dependencies: ["PhilsPluginLibrary"],
    patches: [
        {
            find: "Messages.SCREENSHARE_RELAUNCH",
            replacement: {
                match: /(function .{1,2}\(.{1,2}\){)(.{1,40}(?=selectGuild).+?(?:]}\)}\)))(})/,
                replace: "$1return $self.replacedScreenshareModalComponent(function(){$2}, this, arguments)$3"
            }
        }
    ],
    settings: definePluginSettings({
        hideDefaultSettings: {
            type: OptionType.BOOLEAN,
            description: "Hide Discord screen sharing settings",
            default: true,
        }
    }),
    start(): void {
        initScreenshareStore();
        initScreenshareAudioStore();
        this.screensharePatcher = new ScreensharePatcher().patch();
        this.screenshareAudioPatcher = new ScreenshareAudioPatcher().patch();

        addSettingsPanelButton({
            name: PluginInfo.PLUGIN_NAME,
            icon: ScreenshareSettingsIcon,
            tooltipText: "Screenshare Settings",
            onClick: openScreenshareModal
        });
    },
    stop(): void {
        this.screensharePatcher?.unpatch();
        this.screenshareAudioPatcher?.unpatch();
        Emitter.removeAllListeners(PluginInfo.PLUGIN_NAME);

        removeSettingsPanelButton(PluginInfo.PLUGIN_NAME);
    },
    replacedScreenshareModalComponent
});
