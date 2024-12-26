/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classes } from "@utils/misc";
import { Button } from "@webpack/common";
import React from "react";

import { panelClasses } from "../../../philsPluginLibrary";

export type IconComponent = <T extends { className: string; }>(props: T) => JSX.Element;
export interface SettingsPanelButtonProps extends Partial<React.ComponentProps<typeof Button>> {
    icon?: IconComponent;
}

export const SettingsPanelButton = (props: SettingsPanelButtonProps) => {
    return (
        <Button
            size={Button.Sizes.SMALL}
            className={classes(panelClasses.button, panelClasses.buttonColor)}
            innerClassName={classes(panelClasses.buttonContents)}
            wrapperClassName={classes(panelClasses.button)}
            children={props.icon && <props.icon className={classes(panelClasses.buttonIcon)} />}
            {...props} />
    );
};
