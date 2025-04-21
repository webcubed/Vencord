/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
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
    },
    moreClipDurations: {
        description: "Adds more clip durations",
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
            find: "}isViewerClippingAllowedForUser",
            replacement: {
                match: /isViewerClippingAllowedForUser\(\w+\){/,
                replace: "$&return true;"
            }
        },
        {
            predicate: () => settings.store.clipAllParticipants,
            find: "}isVoiceRecordingAllowedForUser",
            replacement: {
                match: /isVoiceRecordingAllowedForUser\(\w+\){/,
                replace: "$&return true;"
            }
        },
        {
            predicate: () => settings.store.moreClipDurations,
            find: "MINUTES_2=",
            replacement: {
                match: /((\i)\[(\i)\.MINUTES_2=2\*(\i)\.(\i)\.(\i)\.MINUTE\]="MINUTES_2",)/,
                replace: "$&$2[$3.MINUTES_3=3*$4.$5.$6.MINUTE]=\"MINUTES_3\",$2[$3.MINUTES_5=5*$4.$5.$6.MINUTE]=\"MINUTES_5\","
            }
        },
        {
            predicate: () => settings.store.moreClipDurations,
            find: "count:2})",
            replacement: {
                match: /\{value:(\i)\.(\i)\.MINUTES_2,label:(\i)\.(\i)\.formatToPlainString\((\i)\.(\i)\.(\w+),\{count:2\}\)\}/,
                replace: "$&,{value:$1.$2.MINUTES_3,label:$3.$4.formatToPlainString($5.$6.$7,{count:3})},{value:$1.$2.MINUTES_5,label:$3.$4.formatToPlainString($5.$6.$7,{count:5})}"
            }
        }
    ],
    description: "Enables extra clipping options for streams"
});
