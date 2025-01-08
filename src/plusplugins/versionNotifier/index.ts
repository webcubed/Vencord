/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import { checkForVencordUpdate } from "./versionChecker";

export default definePlugin({
    name: "VersionNotifier",
    description: "Show recent changes of the GitHub repository of Vencord+ when new commits get pushed",
    authors: [{ name: "bluejutzu", id: 953708302058012702n }],
	enabledByDefault: true,
    flux: {
        async POST_CONNECTION_OPEN() {
            await checkForVencordUpdate();
        }
    }
});
