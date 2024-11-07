/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type ActivityPacket = {
    d: {
        activities: {
            type: number,
            name: string,
            platform: string
        }[]
    }
};
