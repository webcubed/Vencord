/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addMessagePreSendListener, MessageExtra, MessageObject, removeMessagePreSendListener } from "@api/MessageEvents";
import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

const handleMessage = (channelID: string, message: MessageObject, messageEx: MessageExtra) => messageEx.uploads && messageEx.uploads.forEach(att => (att as any).isRemix = true);

export default definePlugin({
    name: "remixMe",
    description: "Adds the remix tag to every single message that has an attachment",
    authors: [{ name: "kvba", id: 105170831130234880n }],
    start: () => addMessagePreSendListener(handleMessage),
    stop: () => removeMessagePreSendListener(handleMessage)
});
