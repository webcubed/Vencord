/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { classNameFactory } from "@api/Styles";
import { useState } from "@webpack/common";
import { Message } from "discord-types/general";

export const conversions = new Map<string, (conv: string) => void>();
const cl = classNameFactory("vc-converter-");
function Dismiss({ onDismiss }: { onDismiss: () => void; }) {
    return (
        <button
            onClick={onDismiss}
            className={cl("dismiss")}
        >
            Dismiss
        </button>
    );
}
// thanks <@408047304864432139>
export function ConvertIcon({ height = 24, width = 24, className }: {
    height?: number,
    width?: number,
    className?: string
}) {
    return (
        <svg
            viewBox="0 0 98 98"
            height={height}
            width={width}
            className={[cl("icon"), className].join(" ")}
        >
                <path
                fill="currentColor"
        d="m50 16.668v-7.4609c0-1.875-2.25-2.7891-3.543-1.457l-11.664 11.625c-0.83594 0.83203-0.83594 2.125 0 2.957l11.625 11.625c1.332 1.293 3.582 0.375 3.582-1.5v-7.457c13.793 0 25 11.207 25 25 0 3.293-0.625 6.5-1.832 9.375-0.625 1.5-0.16797 3.207 0.95703 4.332 2.125 2.125 5.707 1.375 6.832-1.4141 1.543-3.793 2.375-7.9609 2.375-12.293 0-18.418-14.914-33.332-33.332-33.332zm0 58.332c-13.793 0-25-11.207-25-25 0-3.293 0.625-6.5 1.832-9.375 0.625-1.5 0.16797-3.207-0.95703-4.332-2.125-2.125-5.707-1.375-6.832 1.4141-1.543 3.793-2.375 7.9609-2.375 12.293 0 18.418 14.914 33.332 33.332 33.332v7.4609c0 1.875 2.25 2.7891 3.543 1.457l11.625-11.625c0.83203-0.83203 0.83203-2.125 0-2.957l-11.625-11.625c-1.293-1.293-3.543-0.375-3.543 1.5z" />
        </svg>
    );
}
export function ConverterAccessory({ message }: { message: Message }) {
    const [conversion, setConversion] = useState<string>("");
    conversions.set(message.id, setConversion);
    if (!conversion) return null;
    return (
        <span className={cl("accessory")}>
            <ConvertIcon width={16} height={16} />
            {conversion}
            {" - "}
            <Dismiss onDismiss={() => setConversion("")}/>
        </span>
    );
}
