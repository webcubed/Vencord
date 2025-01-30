/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton, ChatBarButton, ChatBarButtonFactory, removeChatBarButton } from "@api/ChatButtons";
import { addMessagePreSendListener, MessageSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React, useEffect, useState } from "@webpack/common";

let lastState = false;

const ReverseMessageToggle: ChatBarButtonFactory = ({ isMainChat }) => {
    const [enabled, setEnabled] = useState(lastState);

    function setEnabledValue(value: boolean) {
        lastState = value;

        setEnabled(value);
    }

    useEffect(() => {
        const listener: MessageSendListener = async (_, message) => {
            if (enabled && message.content) message.content = message.content.split("").reverse().join("");
        };

        addMessagePreSendListener(listener);
        return () => void removeMessagePreSendListener(listener);
    }, [enabled]);

    if (!isMainChat) return null;

    return (
        <ChatBarButton
            tooltip={enabled ? "Disable Reverse Message" : "Enable Reverse Message"}
            onClick={() => setEnabledValue(!enabled)}
        >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill={enabled ? "var(--green-360)" : "currentColor"} d="M482-160q-134 0-228-93t-94-227v-7l-36 36q-11 11-28 11t-28-11q-11-11-11-28t11-28l104-104q12-12 28-12t28 12l104 104q11 11 11 28t-11 28q-11 11-28 11t-28-11l-36-36v7q0 100 70.5 170T482-240q16 0 31.5-2t30.5-7q17-5 32 1t23 21q8 16 1.5 31.5T577-175q-23 8-47 11.5t-48 3.5Zm-4-560q-16 0-31.5 2t-30.5 7q-17 5-32.5-1T360-733q-8-15-1.5-30.5T381-784q24-8 48-12t49-4q134 0 228 93t94 227v7l36-36q11-11 28-11t28 11q11 11 11 28t-11 28L788-349q-12 12-28 12t-28-12L628-453q-11-11-11-28t11-28q11-11 28-11t28 11l36 36v-7q0-100-70.5-170T478-720Z" /></svg>
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "TalkInReverse",
    authors: [Devs.Tolgchu],
    description: "Reverses the message content before sending it.",
    dependencies: ["MessageEventsAPI", "ChatInputButtonAPI"],

    start: () => addChatBarButton("ReverseMessageToggle", ReverseMessageToggle),
    stop: () => removeChatBarButton("ReverseMessageToggle")
});
