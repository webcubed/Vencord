/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings, useSettings } from "@api/Settings";

export type PluginSettings = {
    [key: string]: any;
};

export type PluginUse<Z extends PluginSettings> = () => Z;
export type PluginGet<Z extends PluginSettings> = () => Z;
export type PluginSet<Z extends PluginSettings> = (s: Z | ((settings: Z) => Z | undefined)) => Z;
export type PluginInitializer<Z extends PluginSettings, T = Z> = (set: PluginSet<Z>, get: PluginGet<Z>) => T;
export interface PluginStore<Z extends PluginSettings> {
    use: PluginUse<Z>,
    get: PluginGet<Z>,
    set: PluginSet<Z>;
}

function createObjectProxy<T extends object>(obj1: T, onUpdate: (updatedObject: T) => void): T {
    const handler: ProxyHandler<T> = {
        set(target, property, value, receiver) {
            const success = Reflect.set(target, property, value, receiver);
            const nestedObj = target[property];

            if (typeof nestedObj === "object") {
                target[property] = createObjectProxy(nestedObj, () => { onUpdate(obj1); }); // On update will call itself until the top level object
            }

            onUpdate(obj1); // This will recursively call on nested objects
            return success;
        }
    };

    return new Proxy(obj1, handler);
}


const startupStates = {};
const settingStorage = new Map();
export function createPluginStore<Z extends PluginSettings = {}>(pluginName: string, storeName: string, f: PluginInitializer<Z>): PluginStore<Z> {
    if (!Settings.plugins[pluginName])
        throw new Error("The specified plugin does not exist");

    if (!Settings.plugins[pluginName].stores)
        Settings.plugins[pluginName].stores = {};

    if (!Settings.plugins[pluginName].stores[storeName]) // Just incase the store doesn't exist we create it here (otherwise we crash)
        Settings.plugins[pluginName].stores[storeName] = {};

    const get: PluginGet<Z> = () => {
        const storeSettings = settingStorage.get(storeName);
        if (!startupStates[storeName]) { // We do this so that we can load all the saved data without the proxy attempting to overwrite it
            const startupInfo = Settings.plugins[pluginName].stores[storeName];

            storeSettings.simpleMode = startupInfo.simpleMode;
            storeSettings.profiles = startupInfo.profiles || [];
            storeSettings.currentProfile = startupInfo.currentProfile || { name: "" };

            startupStates[storeName] = true;
        }

        return storeSettings;
    };

    const set: PluginSet<Z> = (s: ((settings: Z) => Z | undefined) | Z) =>
        (typeof s === "function" ? s(get()) : s) || get();

    const use: PluginUse<Z> = () => { useSettings().plugins[pluginName].stores[storeName]; return get(); }; // useSettings is called to update renderer (after settings change)

    const initialSettings: Z = f(set, get);
    const settingData = Settings.plugins[pluginName].stores[storeName];
    const filteredInitialSettings: unknown = { // We make sure that everything we pass to the IPC is allowed
        profiles: settingData.profiles || [],
        currentProfile: settingData.currentProfile || { name: "" },
        simpleMode: settingData.simpleMode ?? false
    };

    const proxiedSettings = createObjectProxy(initialSettings as unknown, updateCallback); // Setup our proxy that allows us connections to the datastore

    function updateCallback(updatedObject: any) {
        if (!startupStates[storeName]) return; // Wait for the startup information to overwrite the blank proxy

        Settings.plugins[pluginName].stores[storeName] = { // Whenever the proxy is updated we also update the datastore with data that we know can pass through the IPC
            simpleMode: updatedObject.simpleMode ?? false,
            profiles: updatedObject.profiles.map(profile => ({ ...profile })),
            currentProfile: { ...updatedObject.currentProfile } // No clue if this has to be spread or not (disregard the inconsistency ig)
        };
    }

    for (const key of Object.keys(initialSettings)) { proxiedSettings[key] = initialSettings[key]; } // Set them so the nested objects also become proxies
    settingStorage.set(storeName, proxiedSettings);

    set({ ...filteredInitialSettings as Z, ...Settings.plugins[pluginName].stores[storeName] });
    updateCallback(initialSettings);

    return {
        use,
        get,
        set
    };
}
