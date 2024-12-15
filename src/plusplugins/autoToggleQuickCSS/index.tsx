import definePlugin from "@utils/types";
import { Settings, useSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { ApplicationCommandInputType } from "@api/Commands";

export default definePlugin({
    name: "Auto Toggle QuickCSS",
    description: "Enables/disables QuickCSS based on if your Discord window is focused. Disabling QuickCSS can decrease resource usage",
    authors: [{ name: "chaos_the_chaotic", id: 799267390827003916n }],
    commands: [
        {
            name: "cssenable",
            description: "Enables QuickCSS",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute(args, ctx) {
                Settings.useQuickCss = true;
            },
        },
        {
            name: "cssdisable",
            description: "Disables QuickCSS",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute(args, ctx) {
                Settings.useQuickCss = false;
            },
        },
        {
            name: "cssval",
            description: "Logs the current window focus state",
            inputType: ApplicationCommandInputType.BUILT_IN,
            async execute(args, ctx) {
                // Log focus state after 20 seconds delay
                await delay(20000);
                console.log("Window Focus State: ", document.hasFocus() ? "Focused" : "Not Focused");
            },
        }
    ],
    start() {
        // Add event listeners for window focus and blur events
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
    },
    stop() {
        // Remove event listeners
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("blur", onBlur);
    }
});

// Function to handle the window gaining focus
function onFocus() {
    console.log("Window focused, enabling QuickCSS");
    Settings.useQuickCss = true;
}

// Function to handle the window losing focus
function onBlur() {
    console.log("Window blurred, disabling QuickCSS");
    Settings.useQuickCss = false;
}

// Delay utility function
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
