import {definePluginSettings} from "@api/Settings";
import {OptionType} from "@utils/types";
import {Platforms} from "../types/Platforms";

const settings = definePluginSettings({
    platform: {
        type: OptionType.SELECT,
        restartNeeded: true,
        description: "Platform to switch to",
        options: [
            {label: "Xbox Console (Embedded Platform)", value: Platforms.xbox, default: false},
            {label: "PS5 Console (Embedded Platform)", value: Platforms.ps5, default: false},
            {label: "Android (Discord Android)", value: Platforms.android, default: true},
            {label: "Web (Discord Web)", value: Platforms.web, default: false},
            {label: "Desktop (Discord Desktop)", value: Platforms.desktop, default: false},

        ],
    }
})

export {settings}
