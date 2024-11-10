import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "DuelView",
    description: "Make the Mod View label match its true purpose (and its icon)",
    authors: [Devs.RyanCaoDev],

    patches: [
        {
            find: "#{intl::GUILD_MEMBER_MOD_VIEW_TITLE}:\"",
            replacement: {
                match: /#{intl::GUILD_MEMBER_MOD_VIEW_TITLE}:"[\w\s]+",/,
                replace: "#{intl::GUILD_MEMBER_MOD_VIEW_TITLE}:\"Challenge to Duel\","
            }
        }
    ]
});
