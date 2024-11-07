/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { classes } from "@utils/misc";
import { findByPropsLazy } from "@webpack";
import { UserStore } from "@webpack/common";
import { Message } from "discord-types/general";

import { useFormattedPronouns } from "../api";
import { settings } from "../settings";

const styles: Record<string, string> = findByPropsLazy("timestampInline");

const AUTO_MODERATION_ACTION = 24;

function shouldShow(message: Message): boolean {
    if (!settings.store.showInMessages)
        return false;
    if (message.author.bot || message.author.system || message.type === AUTO_MODERATION_ACTION)
        return false;
    if (!settings.store.showSelf && message.author.id === UserStore.getCurrentUser().id)
        return false;

    return true;
}

export const PronounsChatComponentWrapper = ErrorBoundary.wrap(({ message }: { message: Message; }) => {
    return shouldShow(message)
        ? <PronounsChatComponent message={message} />
        : null;
}, { noop: true });

export const CompactPronounsChatComponentWrapper = ErrorBoundary.wrap(({ message }: { message: Message; }) => {
    return shouldShow(message)
        ? <CompactPronounsChatComponent message={message} />
        : null;
}, { noop: true });

function PronounsChatComponent({ message }: { message: Message; }) {
    const { pronouns } = useFormattedPronouns(message.author.id);

    return pronouns && (
        <span
            className={classes(styles.timestampInline, styles.timestamp)}
        >• {pronouns}</span>
    );
}

export const CompactPronounsChatComponent = ErrorBoundary.wrap(({ message }: { message: Message; }) => {
    const { pronouns } = useFormattedPronouns(message.author.id);

    return pronouns && (
        <span
            className={classes(styles.timestampInline, styles.timestamp, "vc-pronoundb-compact")}
        >• {pronouns}</span>
    );
}, { noop: true });
