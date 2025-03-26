/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";


const settings = definePluginSettings({
    clipAllStreams: {
        description: "Allows clipping on all streams regardless of the streamer's settings",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    clipAllParticipants: {
        description: "Allows recording of all voice chat participants regardless of their settings",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "BetterClips",
    authors: [
        { id: 211461918127292416n, name: "Loukious" }
    ],
    settings,
    patches: [
        {
            predicate: () => settings.store.clipAllStreams,
            find: "isViewerClippingAllowedForUser",
            replacement: {
                match: /isViewerClippingAllowedForUser\(\w+\){/,
                replace: "$&return true;"
            }
        },
        {
            predicate: () => settings.store.clipAllParticipants,
            find: "isVoiceRecordingAllowedForUser",
            replacement: {
                match: /isVoiceRecordingAllowedForUser\(\w+\){/,
                replace: "$&return true;"
            }
        }
    ],
    description: "Enables extra clipping options for streams"
});
