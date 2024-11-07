/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import { useProfilePronouns } from "./api";
import PronounsAboutComponent from "./components/PronounsAboutComponent";
import { CompactPronounsChatComponentWrapper, PronounsChatComponentWrapper } from "./components/PronounsChatComponent";
import { settings } from "./settings";

export default definePlugin({
    name: "PronounDB",
    authors: [Devs.Tyman, Devs.TheKodeToad, Devs.Ven, Devs.Elvyra],
    description: "Adds pronouns to user profiles and messages using PronounDB",
    patches: [
        {
            find: "showCommunicationDisabledStyles",
            replacement: [
                // Add next to username (compact mode)
                {
                    match: /("span",{id:\i,className:\i,children:\i}\))/,
                    replace: "$1, $self.CompactPronounsChatComponentWrapper(arguments[0])"
                },
                // Patch the chat timestamp element (normal mode)
                {
                    match: /(?<=return\s*\(0,\i\.jsxs?\)\(.+!\i&&)(\(0,\i.jsxs?\)\(.+?\{.+?\}\))/,
                    replace: "[$1, $self.PronounsChatComponentWrapper(arguments[0])]"
                }
            ]
        },

        {
            find: ".Messages.USER_PROFILE_PRONOUNS",
            group: true,
            replacement: [
                {
                    match: /\.PANEL},/,
                    replace: "$&{pronouns:vcPronoun,source:vcPronounSource,hasPendingPronouns:vcHasPendingPronouns}=$self.useProfilePronouns(arguments[0].user?.id),"
                },
                {
                    match: /text:\i\.\i.Messages.USER_PROFILE_PRONOUNS/,
                    replace: '$&+(vcPronoun==null||vcHasPendingPronouns?"":` (${vcPronounSource})`)'
                },
                {
                    match: /(\.pronounsText.+?children:)(\i)/,
                    replace: "$1(vcPronoun==null||vcHasPendingPronouns)?$2:vcPronoun"
                }
            ]
        }
    ],

    settings,

    settingsAboutComponent: PronounsAboutComponent,

    // Re-export the components on the plugin object so it is easily accessible in patches
    PronounsChatComponentWrapper,
    CompactPronounsChatComponentWrapper,
    useProfilePronouns
});
