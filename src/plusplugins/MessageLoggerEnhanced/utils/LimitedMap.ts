/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../index";

export class LimitedMap<K, V> {
    public map: Map<K, V> = new Map();
    constructor() { }

    set(key: K, value: V) {
        if (settings.store.cacheLimit > 0 && this.map.size >= settings.store.cacheLimit) {
            // delete the first entry
            this.map.delete(this.map.keys().next().value);
        }
        this.map.set(key, value);
    }

    get(key: K) {
        return this.map.get(key);
    }
}
