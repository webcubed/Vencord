/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NeverPausePreviews",
    description: "Prevents in-call/PiP previews (screenshare, streams, etc.) from pausing, even if the client loses focus",
    authors: [{
        name: "vappster",
        id: 747192967311261748n
    }],
    patches: [
        {   //picture-in-picture player patch
            find: "streamerPaused()",
            replacement: {
                match: /return null![^}]+/,
                replace: "return false"
            }
        },
        {   //in-call player patch #1 (keep stream playing)
            find: "emptyPreviewWrapper,children",
            replacement: {
                match: /paused:\i([^=])/,
                replace: "paused:false$1"
            }
        },
        {   //in-call player patch #2 (disable "your stream is still running" text overlay)
            find: "let{mainText:",
            replacement: {
                match: /let{[^;]+/,
                replace: "return"
            }
        }
    ],
});
