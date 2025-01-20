/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findStoreLazy } from "@webpack";
import { ComponentDispatch, FluxDispatcher } from "@webpack/common";

const PurchasedItemsFestivityStore = findStoreLazy("PurchasedItemsFestivityStore");

function wowMoment() {
    if (PurchasedItemsFestivityStore.canPlayWowMoment) return false;
    FluxDispatcher.dispatch({ type: "PURCHASED_ITEMS_FESTIVITY_SET_CAN_PLAY_WOW_MOMENT", value: true });
    ComponentDispatch.dispatch("PREMIUM_SUBSCRIPTION_CREATED");
    return true;
}

export default definePlugin({
    name: "WowMoment",
    description: "Replace the Vibe with Wumpus animation with the Wumpus Wow Moment animation",
    authors: [Devs.Sqaaakoi],
    patches: [
        // {
        //     find: "PREMIUM_WOW_MOMENT_MEDIA_PREFETCH_TRIGGER,",
        //     replacement: {
        //         match: /
        //     }
        // }
        {
            find: "mod+alt+shift+w",
            replacement: {
                match: /\(\(0,\i\.\i\)\(\i\.closeAllModals\),!1\)/,
                replace: "$self.wowMoment()"
            }
        }
    ],
    wowMoment
});
