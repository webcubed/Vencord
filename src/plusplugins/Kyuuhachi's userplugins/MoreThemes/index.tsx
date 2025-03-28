import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "MoreThemes",
    description: "Enables Darker and Midnight themes",
    authors: [Devs.Kyuuhachi],

    patches: [
        { // Matches twice: the settings menu and the settings context menu
            find: '("appearance_settings")',
            replacement: {
                match: /\("appearance_settings"\)/,
                replace: "$&||true"
            },
            all: true,
        },
        { // Make it actually save the setting instead of falling back to dark
            find: ')("ThemeStore"))return',
            replacement: {
                match: /(?<=\)\("ThemeStore"\))(?=\)return)/,
                replace: "&&false"
            },
        }
    ],
});
