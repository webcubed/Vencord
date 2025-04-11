/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType } from "@api/Commands";
import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

const morseMap = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
    G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
    S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
    " ": "/"
};

const toMorse = (text: string) => {
    return text.toUpperCase().split("").map(char => morseMap[char] ?? "").join(" ");
};

const fromMorse = (text: string) => {
    const reversedMap = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));
    const raw = text.split(" ").map(code => reversedMap[code] ?? "").join("").toLowerCase();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
};

// boo regex
const isMorse = (text: string) => /^[.\-/ ]+$/.test(text);

export default definePlugin({
    name: "Morse",
    description: "Adds a slash command that allows you to quickly translate to/from morse code",
    authors: [EquicordDevs.zyqunix],
    commands: [
        {
            inputType: ApplicationCommandInputType.BUILT_IN_TEXT,
            name: "morse",
            description: "Translate to or from Morse code",
            options: [
                {
                    name: "text",
                    description: "Text to convert",
                    type: ApplicationCommandOptionType.STRING,
                    required: true
                }
            ],
            execute: opts => {
                const input = opts.find(o => o.name === "text")?.value as string;
                const output = isMorse(input) ? fromMorse(input) : toMorse(input);
                return {
                    content: `${output}`
                };
            },
        }
    ]
});
