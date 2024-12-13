/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findAll } from "@webpack";

export default definePlugin({
    name: "DisableAnimations",
    description: "Disables most of Discord's animations",
    authors: [EquicordDevs.seth],
    start() {
        this.springs = findAll((mod) => {
            if (!mod.Globals) return false;
            return true;
        });

        for (const spring of this.springs) {
            spring.Globals.assign({
                skipAnimation: true,
            });
        }

        this.css = document.createElement("style");
        this.css.innerText = "* { transition: none !important; animation: none !important; }";

        document.head.appendChild(this.css);
    },
    stop() {
        for (const spring of this.springs) {
            spring.Globals.assign({
                skipAnimation: false,
            });
        }

        if (this.css) this.css.remove();
    }
});
