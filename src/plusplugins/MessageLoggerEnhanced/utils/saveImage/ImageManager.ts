/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    createStore,
    del,
    get,
    keys,
    set,
} from "@api/DataStore";
import { sleep } from "@utils/misc";
import { LoggedAttachment } from "userplugins/vc-message-logger-enhanced/types";

import { Flogger, Native } from "../..";
import { DEFAULT_IMAGE_CACHE_DIR } from "../constants";

const ImageStore = createStore("MessageLoggerImageData", "MessageLoggerImageStore");

interface IDBSavedImage { attachmentId: string, path: string; }
const idbSavedImages = new Map<string, IDBSavedImage>();
(async () => {
    try {

        const paths = await keys(ImageStore);
        paths.forEach(path => {
            const str = path.toString();
            if (!str.startsWith(DEFAULT_IMAGE_CACHE_DIR)) return;

            idbSavedImages.set(str.split("/")?.[1]?.split(".")?.[0], { attachmentId: str.split("/")?.[1]?.split(".")?.[0], path: str });
        });
    } catch (err) {
        Flogger.error("Failed to get idb images", err);
    }
})();

export async function getImage(attachmentId: string, fileExt?: string | null): Promise<any> {
    // for people who have access to the native API but some images are still in IndexedDB
    // also for people who don't have the native API
    const idbPath = idbSavedImages.get(attachmentId)?.path;
    if (idbPath)
        return get(idbPath, ImageStore);

    if (IS_WEB) return null;

    return await Native.getImageNative(attachmentId);
}

export async function downloadAttachment(attachemnt: LoggedAttachment): Promise<string | undefined> {
    if (IS_WEB) {
        return await downloadAttachmentWeb(attachemnt);
    }

    const { path, error } = await Native.downloadAttachment(attachemnt);

    if (error || !path) {
        Flogger.error("Failed to download attachment", error, path);
        return;
    }

    return path;
}

export async function deleteImage(attachmentId: string): Promise<void> {
    const idbPath = idbSavedImages.get(attachmentId)?.path;
    if (idbPath)
        return await del(idbPath, ImageStore);


    if (IS_WEB) return;

    await Native.deleteFileNative(attachmentId);
}


async function downloadAttachmentWeb(attachemnt: LoggedAttachment, attempts = 0) {
    if (!attachemnt?.url || !attachemnt?.id || !attachemnt?.fileExtension) {
        Flogger.error("Invalid attachment", attachemnt);
        return;
    }

    const res = await fetch(attachemnt.url);
    if (res.status !== 200) {
        if (res.status === 404 || res.status === 403) return;
        attempts++;
        if (attempts > 3) {
            Flogger.warn(`Failed to get attachment ${attachemnt.id} for caching, error code ${res.status}`);
            return;
        }

        await sleep(1000);
        return downloadAttachmentWeb(attachemnt, attempts);
    }
    const ab = await res.arrayBuffer();
    const path = `${DEFAULT_IMAGE_CACHE_DIR}/${attachemnt.id}${attachemnt.fileExtension}`;

    // await writeImage(imageCacheDir, `${attachmentId}${fileExtension}`, new Uint8Array(ab));

    await set(path, new Uint8Array(ab), ImageStore);
    idbSavedImages.set(attachemnt.id, { attachmentId: attachemnt.id, path });

    return path;
}
