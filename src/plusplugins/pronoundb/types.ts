/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface UserProfileProps {
    userId: string;
}

export interface UserProfilePronounsProps {
    currentPronouns: string | null;
    hidePersonalInformation: boolean;
}

export type PronounSets = Record<string, PronounCode[]>;
export type PronounsResponse = Record<string, { sets?: PronounSets; }>;

export interface PronounsCache {
    sets?: PronounSets;
}

export const PronounMapping = {
    he: "He/Him",
    it: "It/Its",
    she: "She/Her",
    they: "They/Them",
    any: "Any pronouns",
    other: "Other pronouns",
    ask: "Ask me my pronouns",
    avoid: "Avoid pronouns, use my name",
    unspecified: "No pronouns specified.",
} as const satisfies Record<string, string>;

export type PronounCode = keyof typeof PronounMapping;

export interface Pronouns {
    pronouns?: string;
    source: string;
    hasPendingPronouns: boolean;
}

export const enum PronounsFormat {
    Lowercase = "LOWERCASE",
    Capitalized = "CAPITALIZED"
}

export const enum PronounSource {
    PreferPDB,
    PreferDiscord
}
