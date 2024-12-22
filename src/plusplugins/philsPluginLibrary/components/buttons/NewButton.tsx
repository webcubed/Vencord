/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@webpack/common";
import React from "react";

import { IconTooltipButton } from ".";

export const NewButton = (props: typeof Button["defaultProps"]) => {
    return (
        <IconTooltipButton
            color={Button.Colors.PRIMARY}
            tooltipText="New Profile"
            icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            }
            {...props} />
    );
};
