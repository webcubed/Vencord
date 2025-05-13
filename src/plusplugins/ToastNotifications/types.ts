/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const enum MessageTypes {
    CHANNEL_RECIPIENT_ADD = 1,
    CHANNEL_RECIPIENT_REMOVE = 2,
    CALL = 3,
    CHANNEL_NAME_CHANGE = 4,
    CHANNEL_ICON_CHANGE = 5,
    CHANNEL_PINNED_MESSAGE = 6,
}

export const enum RelationshipType {
    FRIEND = 1,
    BLOCKED = 2,
    INCOMING_REQUEST = 3,
    OUTGOING_REQUEST = 4,
}

export const enum StreamingTreatment {
    NORMAL = 0,
    NO_CONTENT = 1,
    IGNORE = 2
}
