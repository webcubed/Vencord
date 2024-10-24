/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants.js";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const linkRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const SlateTransforms = findByPropsLazy("insertText", "selectCommandOption");

export default definePlugin({
    name: "UnMaskedLinkPaste",
    authors: [
        Devs.TheSun,
        {
            name: "6c0",
            id: 953041961936359424n,
        },
    ],
    description: "Disable converting text into a hyperlink when pasting a link while having text selected",
    patches: [
        {
            find: ".selection,preventEmojiSurrogates:",
            replacement: {
                match: /s\.bN\.withoutNormalizing\(e,\(\)=>\{a\.Q\.select\(e,n\),e\.insertText\("\["\),a\.Q\.select\(e,r\),0===s\.C0\.compare\(n\.path,r\.path\)&&a\.Q\.move\(e,\{distance:1\}\),(\i)\.insertText\("\]\("\.concat\((\i)\.target,"\)"\)\)\}\)/,
                replace: "$self.handlePaste($1, $2, () => $&)",
            },
        },
    ],

    handlePaste(e, t, originalBehavior: () => void) {
        if (t.target && linkRegex.test(t.target)) {
            SlateTransforms.insertText(e, `${t.target}`);
        } else originalBehavior();
    },
});
