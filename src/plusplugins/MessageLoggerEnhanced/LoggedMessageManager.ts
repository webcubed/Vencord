/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flogger, settings } from ".";
import { addMessageIDB, db, DBMessageStatus, deleteMessagesBulkIDB, getOldestMessagesIDB } from "./db";
import { LoggedMessage, LoggedMessageJSON } from "./types";
import { cleanupMessage } from "./utils";
import { cacheMessageImages } from "./utils/saveImage";

export const addMessage = async (message: LoggedMessage | LoggedMessageJSON, status: DBMessageStatus) => {
    if (settings.store.saveImages && status === DBMessageStatus.DELETED)
        await cacheMessageImages(message);
    const finalMessage = cleanupMessage(message);

    await addMessageIDB(finalMessage, status);

    if (settings.store.messageLimit > 0) {
        const currentMessageCount = await db.count("messages");
        if (currentMessageCount > settings.store.messageLimit) {
            const messagesToDelete = currentMessageCount - settings.store.messageLimit;
            if (messagesToDelete <= 0 || messagesToDelete >= settings.store.messageLimit) return;

            const oldestMessages = await getOldestMessagesIDB(messagesToDelete);

            Flogger.info(`Deleting ${messagesToDelete} oldest messages`);
            await deleteMessagesBulkIDB(oldestMessages.map(m => m.message_id));
        }
    }
};
