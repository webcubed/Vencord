/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MarkDownRules, PluginMarkDownRules } from "@api/Markdown";
import definePlugin from "@utils/types";
import { ASTNode } from "simple-markdown";

var styleMap = { // credit to FoxInFlame for the map
    "4": { color: "#be0000" },
    "c": { color: "#fe3f3f" },
    "6": { color: "#d9a334" },
    "e": { color: "#fefe3f" },
    "2": { color: "#00be00" },
    "a": { color: "#3ffe3f" },
    "b": { color: "#3ffefe" },
    "3": { color: "#00bebe" },
    "1": { color: "#0000be" },
    "9": { color: "#3f3ffe" },
    "d": { color: "#fe3ffe" },
    "5": { color: "#be00be" },
    "f": { color: "#ffffff" },
    "7": { color: "#bebebe" },
    "8": { color: "#3f3f3f" },
    "0": { color: "#000000" },
    "l": { fontWeight: "bold" },
    "n": { textDecoration: "underline" },
    "o": { fontStyle: "italic" },
    "m": { textDecoration: "line-through" },
};

export default definePlugin({
    name: "MinecraftFormatCodes",
    description: "Adds Minecraft's color and format codes to markdown",
    authors: [
        {
            name: "i am me",
            id: 984392761929256980n,
        },
    ],
    dependencies: ["MarkdownAPI"],
    rules(r: MarkDownRules) {
        return {
            RULES: {
                ColorCodes: {
                    order: 25,
                    requiredFirstCharacters: ["&"],
                    match(source, state, prev) {
                        return /^&([\w\d])([\w\d\W\D]+)&r/.exec(source) || /^&([\w\d])([\w\d\W\D]+)/.exec(source);
                    },
                    parse(capture, nastedParse, state) {
                        return {
                            code: capture[1],
                            content: capture[2],
                            nasted: nastedParse(capture[2], state)
                        };
                    },
                    react(node: { code: string, content: string, nasted: ASTNode; }, recurseOutput, state) {
                        return <span style={styleMap[node.code]} key={state.key} id={"mc-" + node.code + (state.key ? "-" + state.key : "")}>{recurseOutput(node.nasted, state)}</span>;
                    }
                }
            }
        } as PluginMarkDownRules;
    }
});
