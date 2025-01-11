/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import definePlugin from "@utils/types";

export default definePlugin({
    name: "Multistickers",
    description: "Lets you send up to 3 stickers and shift-click stickers",
    authors: [
        {
            id: 579731384868798464n,
            name: "void",
        },
    ],
    patches: [{
        find: "StickerMessagePreviewStore",
        replacement: [{
            match: /function (\w+)\(\w+\){.+?(\w+\.\w+\.FirstThreadMessage)\?(\w+):(\w+).+?}/,
            replace: "function $1(e) { $self.storeAddStickerPreview(e, $2, $3, $4) }",
        },
        {
            match: /function (\w+)\(\w+\){let{channelId:\w+,draftType.+?(\w+\.\w+\.FirstThreadMessage)\?(\w+):(\w+).+?delete.+?}/,
            replace: "function $1(e) { $self.storeClearStickerPreview(e, $2, $3, $4) }",
        }
        ],
    },
    {
        find: ".stickerPreviewContainer",
        replacement: {
            match: /(?<=\.closeButton,.+?\}\),onClick:\(\)=>)\(0,(.+?)\)\((\w+),(\w+\.\w+\.\w+)\)/,
            replace: (_, clear, channelId, type) => {
                return `(0,${clear})(${channelId},${type},e.id)`; // i really really dont want to match the entire map function, e is almost always react props
            }
        }
    },
    {
        find: "type:\"CLEAR_STICKER_PREVIEW\",channelId:",
        replacement: {
            match: /function (\w+)\(\w+,\w+\)\{(\w+\.\w+)\.dispatch.+?\}\)\}/,
            replace: (_, name, Dispatch) => {
                return `function ${name}(channelId, draftType, stickerId) { ${Dispatch}.dispatch({ type: "CLEAR_STICKER_PREVIEW", channelId, draftType, stickerId }) }`;
            }
        }
    },
    {
        find: "__invalid_stickerPickerPreviewDimensions),",
        replacement: {
            match: /\w+=(\w+)=>{.+?altKey;/,
            replace: (match, event) => match + `if (${event}.shiftKey) $self.shiftEvent.set();`,
        }
    },
    {
        find: ".stickers,previewSticker:",
        replacement: {
            match: /(getUploadCount.+?0)/,
            replace: '$1 || $self.shiftEvent.get("attach")',
        }
    },
    {
        find: "name:\"expression-picker-last-active-view\"",
        replacement: {
            match: /(?=name:"expression-picker-last-active-view")(.+?=>.+?=>.+?=>\{)/,
            replace: "$1 if ($self.shiftEvent.get(\"close\")) return;"
        }
    }],

    storeAddStickerPreview: function (event, firstThreadMessage, threadStore, store) {
        const { channelId, draftType } = event;
        const storeToUse = draftType === firstThreadMessage ? threadStore : store;

        storeToUse[channelId] = storeToUse[channelId]?.filter(x => x.id !== event.sticker.id);
        if (storeToUse[channelId]?.length === 3) storeToUse[channelId].shift();
        storeToUse[channelId] = [...storeToUse[channelId] ?? [], event.sticker];
    },

    storeClearStickerPreview: function (event, firstThreadMessage, threadStore, store) {
        const { channelId, draftType, stickerId } = event;
        const storeToUse = draftType === firstThreadMessage ? threadStore : store;

        if (stickerId) return void (storeToUse[channelId] = storeToUse[channelId]?.filter(x => x.id !== stickerId));
        if (storeToUse[channelId] != null) delete storeToUse[channelId];
    },

    shiftEvent: {
        shouldNotClose: false,
        shouldAttach: false,
        set: function () {
            this.shouldNotClose = true;
            this.shouldAttach = true;
        },
        get(type: string) {
            let ret = false;
            switch (type) {
                case "attach":
                    ret = this.shouldAttach;
                    this.shouldAttach = false;
                    break;
                case "close":
                    ret = this.shouldNotClose;
                    this.shouldNotClose = false;
            }
            return ret;
        },
    },
});
