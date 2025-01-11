/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

interface attachment {
    originalItem: OriginalItem;
    contentType: string;
    type: string;
    width: number | string;
    height: number;
}

interface OriginalItem {
    size: number;
    url: string;
    proxy_url: string;
    content_type: string;
    type: string;
}


interface PatchSrcProps {
    item: attachment;
    type: string;
}

interface PatchOtherAttachmentsProps {
    items: PatchSrcProps[]
}

const REPLACE_MIMES = new Set([
    "image/webp"
]);
export default definePlugin({
    name: "RenderMoreMedia",
    authors: [Devs.sadan],
    description: "Makes your Discord client render more media file types",
    patches: [
        {
            find: "duration_secs]",
            replacement: {
                match: /(src:)(\(.{0,50}}\))/,
                replace: "$1$self.patchSrc(arguments[0])||$2"
            }
        },
        {
            find: "groupableVisualMediaItems",
            replacement: {
                match: /let.{0,40}groupableVisualMediaItems/,
                replace: "$self.patchOtherAttachments(arguments[0]);$&"
            }
        }
    ],

    patchSrc(props: PatchSrcProps): string {
        try {
            if(!REPLACE_MIMES.has(props.item.contentType)) return "";
            const url = new URL(props.item.originalItem.url);
            if(url.hostname !== "cdn.discordapp.com") return "";

            return props.item.originalItem.url;
        } catch (e) {
            console.error(e);
            return "";
        }
    },

    patchOtherAttachments(props: PatchOtherAttachmentsProps) {
        try {
            for(const { item } of props.items) {
                if(item.contentType.startsWith("image/svg")) {
                    const url = new URL(item.originalItem.url);
                    if(url.hostname !== "cdn.discordapp.com") continue;
                    item.type = "IMAGE";
                    item.width = 350;
                    item.originalItem.proxy_url = item.originalItem.url;
                    continue;
                }
                switch(item.contentType){
                    // discord's cdn is wacky
                    // case "image/apng":
                    // case "image/vnd.mozilla.apng":
                    // item.height = 350;
                    // item.width = 550;
                    case "image/avif":
                        const url = new URL(item.originalItem.url);
                        if(url.hostname !== "cdn.discordapp.com") continue;
                        item.type = "IMAGE";
                        console.log(item);
                        item.originalItem.proxy_url = item.originalItem.url;
                        continue;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});
