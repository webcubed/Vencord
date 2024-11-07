/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Text, UserStore } from "@webpack/common";

import style from "./style.css?managed";
const characterCountClass = findByPropsLazy("characterCount");

const settings = definePluginSettings({
    showOnZero: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Show the counter when there are zero characters in the box",
    }
});
export default definePlugin({
    settings,
    patches: [
        {
            find: ".CHARACTER_COUNT_OVER_LIMIT",
            replacement: [
                {
                    match: /let/,
                    replace:
                        "return $self.CharacterCountComponent(arguments[0]);$&",
                }
            ],
        },
    ],
    name: "ShowCharacterCount",
    authors: [
        {
            name: "sadan",
            id: 521819891141967883n,
        }, {
            name: "iamme",
            id: 984392761929256980n,
        }
    ],
    start(){
        enableStyle(style);
    },
    stop(){
        disableStyle(style);
    },
    description: "Show your character count while typing.",
    CharacterCountComponent({ textValue, className }: {
        textValue: string;
        className?: string;
    }): JSX.Element {
        return (
            <Text
                variant="heading-sm/bold"
                className={[className, characterCountClass.characterCount, "vc-scc-character-count"].join(" ")}
                style={{
                    right: "-23px",
                    color: (UserStore.getCurrentUser().premiumType ? 4000 : 2000) < textValue.length ? "red" : void 0
                }}
            >
                {textValue.length === 0 ? (settings.store.showOnZero? textValue.length : "") : textValue.length}
            </Text>
        );
    },
});
