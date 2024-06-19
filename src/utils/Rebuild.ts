/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export async function rebuildAndRestart() {
    await VencordNative.updater.rebuild();
    window.DiscordNative.app.relaunch();
}
