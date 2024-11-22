/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import * as KnownSettings from "./knownSettings";
import { KNOWN_PLUGINS_LEGACY_DATA_KEY, KNOWN_SETTINGS_DATA_KEY } from "./knownSettings";
import { openNewPluginsModal } from "./NewPluginsModal";

export default definePlugin({
    name: "NewPluginsManager",
    description: "A utility that notifies you when new plugins are added to your installation",
    authors: [Devs.Sqaaakoi],
    enabledByDefault: true, // This is intentional.
    flux: {
        async POST_CONNECTION_OPEN() {
            openNewPluginsModal();
        }
    },
    openNewPluginsModal,
    KNOWN_PLUGINS_LEGACY_DATA_KEY,
    KNOWN_SETTINGS_DATA_KEY,
    KnownSettings
});
