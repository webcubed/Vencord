/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { copyWithToast } from "@utils/misc";
import { Button, Forms, Toasts } from "@webpack/common";

import { Native, settings } from "../..";
import { DEFAULT_IMAGE_CACHE_DIR } from "../../utils/constants";

const cl = classNameFactory("folder-upload");

function createDirSelector(settingKey: "logsDir" | "imageCacheDir", successMessage: string) {
    return function DirSelector({ option }) {
        if (IS_WEB) return null;

        return (
            <Forms.FormSection>
                <Forms.FormTitle>{option.description}</Forms.FormTitle>
                <SelectFolderInput
                    settingsKey={settingKey}
                    successMessage={successMessage}
                />
            </Forms.FormSection>
        );
    };
}

export const ImageCacheDir = createDirSelector("imageCacheDir", "Successfully updated Image Cache Dir");
export const LogsDir = createDirSelector("logsDir", "Successfully updated Logs Dir");

interface Props {
    settingsKey: "imageCacheDir" | "logsDir",
    successMessage: string,
}

export function SelectFolderInput({ settingsKey, successMessage }: Props) {
    const path = settings.store[settingsKey];

    function getDirName(path: string) {
        const parts = path.split("\\").length > 1 ? path.split("\\") : path.split("/");

        return parts.slice(parts.length - 2, parts.length).join("\\");
    }

    async function onFolderSelect() {
        try {
            const res = await Native.chooseDir(settingsKey);
            settings.store[settingsKey] = res;

            return Toasts.show({
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS,
                message: successMessage
            });
        } catch (err) {
            Toasts.show({
                id: Toasts.genId(),
                type: Toasts.Type.FAILURE,
                message: "Failed to update directory"
            });
        }
    }

    return (
        <div className={cl("-container")}>
            <div onClick={() => copyWithToast(path)} className={cl("-input")}>
                {path == null || path === DEFAULT_IMAGE_CACHE_DIR ? "Choose Folder" : getDirName(path)}
            </div>
            <Button
                className={cl("-button")}
                size={Button.Sizes.SMALL}
                onClick={onFolderSelect}
            >
                Browse
            </Button>
        </div>
    );

}
