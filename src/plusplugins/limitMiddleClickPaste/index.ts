/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";


const settings = definePluginSettings({
    limitTo: {
        type: OptionType.SELECT,
        description: "Allow middle click pastes:",
        options: [
            {
                label: "Whenever a text box is active",
                value: "active",
                default: true
            },
            {
                label: "Only when clicking on a text box",
                value: "direct"
            }
        ]
    },
    reenableDelay: {
        type: OptionType.SLIDER,
        description: "Milliseconds until re-enabling global paste events after middle click.",
        markers: makeRange(0, 1000, 500),
        default: 500,
    },
});

let containerEl;

export default definePlugin({
    name: "LimitMiddleClickPaste",
    description: "For middle-click autoscroll users, prevents middle-click from making unwanted pastes.",
    authors: [EquicordDevs.nobody],

    settings: settings,

    start() {
        // Discord adds it's paste listeners to #app-mount. We can intercept them
        // by attaching listeners a child element.
        containerEl = document.querySelector("[class^=appAsidePanelWrapper]")!;
        containerEl.addEventListener("paste", blockPastePropogation);

        // Also add them to body to intercept the event listeners on document
        document.body.addEventListener("paste", blockPastePropogation);

        document.body.addEventListener("mousedown", disablePasteOnMousedown);
    },

    stop() {
        containerEl.removeEventListener("paste", blockPastePropogation);

        document.body.removeEventListener("paste", blockPastePropogation);

        document.body.removeEventListener("mousedown", disablePasteOnMousedown);
        pasteDisabled = false;
    },
});

let pasteDisabled: boolean = false;
let timeoutID: number | undefined;

function blockPastePropogation(e: ClipboardEvent) {
    if (pasteDisabled) {
        e.stopImmediatePropagation();
    }
}

function disablePasteOnMousedown(e: MouseEvent) {
    if (e.button !== 1) return;
    let testEl;
    switch (settings.store.limitTo) {
        case "active":
            testEl = document.activeElement;
            break;
        case "direct":
            testEl = e.target;
            break;
    }
    if (maybeEditable(testEl as HTMLElement | null)) return;
    window.clearTimeout(timeoutID);
    pasteDisabled = true;
    timeoutID = window.setTimeout(() => {
        pasteDisabled = false;
    }, settings.store.reenableDelay);
}

function maybeEditable(el: HTMLElement | null): boolean {
    if (!el) return false;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
    let parent: HTMLElement | null;
    for (parent = el; parent; parent = parent.parentElement) {
        if (parent.isContentEditable) return true;
    }
    return false;
}
