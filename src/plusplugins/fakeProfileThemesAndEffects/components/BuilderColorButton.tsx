/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Popout, useRef } from "@webpack/common";

import { BuilderButton, type BuilderButtonProps, CustomColorPicker, type CustomColorPickerProps } from ".";

export interface BuilderColorButtonProps extends Pick<BuilderButtonProps, "label">, Pick<CustomColorPickerProps, "suggestedColors"> {
    color: number | null;
    setColor: (color: number | null) => void;
}

export function BuilderColorButton({ label, color, setColor, suggestedColors }: BuilderColorButtonProps) {
    const buttonRef = useRef(null);
    return (
        <Popout
            position="bottom"
            targetElementRef={buttonRef}
            renderPopout={() => (
                <CustomColorPicker
                    value={color}
                    onChange={setColor}
                    showEyeDropper={true}
                    suggestedColors={suggestedColors}
                />
            )}
        >
            {popoutProps => {
                const hexColor = color ? "#" + color.toString(16).padStart(6, "0") : undefined;

                return (
                    <BuilderButton
                        label={label}
                        tooltip={hexColor}
                        selectedStyle={hexColor ? { background: hexColor } : undefined}
                        buttonProps={popoutProps}
                        buttonRef={buttonRef}
                    />
                );
            }}
        </Popout>
    );
}
