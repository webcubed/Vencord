import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { PresenceStore, Text } from "@webpack/common";

const settings = definePluginSettings({
    artistSeparator: {
        description: "Text to use to separate artist names",
        type: OptionType.STRING,
        default: "; "
    },
    onlyShowMainArtist: {
        description: "Only show the main artist if there are multiple",
        type: OptionType.BOOLEAN,
        default: false
    },
    showAlbumName: {
        description: "Show album name under the artist name",
        type: OptionType.BOOLEAN,
        default: true
    }
});

const OTHER_USER_SPOTIFY_CARD_FIND = /\.USER_PROFILE_LIVE_ACTIVITY_CARD.+action:"OPEN_SPOTIFY_ARTIST".+HOVER_ACTIVITY_CARD.+FULL_SIZE/;
const SELF_USER_SPOTIFY_CARD_FIND = new RegExp("FULL_SIZE},.=\\(0,.\\..\\)\\({activity:.,user:.}\\),.=");

const SHARED_PATCHES: {
    match: RegExp,
    replace: string,
    predicate?: () => boolean;
}[] = [
        {
            match: /\?", "/,
            replace: "?`${$self.settings.store.artistSeparator}`"
        },
        {
            match: /text:(\i).map(.+)(\i.length-1)/,
            replace: "text:($self.settings.store.onlyShowMainArtist ? [$1[0]] : $1).map$2($self.settings.store.onlyShowMainArtist ? 1 === 2: $3)"
        },
        {
            match: /user:(.)(.+)(.+OPEN_SPOTIFY_TRACK"}\),\(0,.\.[a-zA-Z]{0,10}\)\((.).+)(.\(\))(.+user)/,
            replace: "user:$1$2$3$5, $self.AlbumText($4)$6"
        }
    ];

export default definePlugin({
    name: "BetterSpotifyCard",
    description: "Show more info on the Spotify activity card",
    authors: [Devs.nin0dev],
    settings,
    AlbumText(presence) {
        if (!settings.store.showAlbumName) return <></>;
        return <Text variant="text-xs/normal" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} >
            {presence.assets.large_text}
        </Text>;
    },
    patches: [
        {
            find: OTHER_USER_SPOTIFY_CARD_FIND,
            replacement: SHARED_PATCHES
        },
        {
            find: SELF_USER_SPOTIFY_CARD_FIND,
            replacement: SHARED_PATCHES
        }
    ]
});
