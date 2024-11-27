/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Link } from "@components/Link";
import { SuncordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { User } from "discord-types/general";

let data = {
    avatars: {} as Record<string, string>,
};

const settings = definePluginSettings({
    preferNitro: {
        description: "Which profile picture to show if both a default animated (Nitro) profile picture and UserPFP profile picture are present",
        type: OptionType.SELECT,
        options: [
            { label: "UserPFP", value: true, default: true },
            { label: "Nitro", value: false },
        ],
    },
    urlForDB: {
        type: OptionType.STRING,
        description: "The source to use to load profile pictures from",
        default: "https://userpfp.github.io/UserPFP/source/data.json",
        placeholder: "Default value: https://userpfp.github.io/UserPFP/source/data.json"
    }
});

export default definePlugin({
    data,
    name: "UserPFP",
    description: "Allows you to use an animated profile picture without having Nitro",
    authors: [SuncordDevs.nexpid, SuncordDevs.thororen],
    settings,
    settingsAboutComponent: () => (
        <>
            <Link href="https://userpfp.github.io/UserPFP/#how-to-request-a-profile-picture-pfp">
                <b>Submit your own profile picture here!</b>
            </Link>
            <br></br>
            <Link href="https://ko-fi.com/coolesding">
                <b>Support UserPFP here!</b>
            </Link>
        </>
    ),
    patches: [
        {
            // Normal Profiles
            find: "getUserAvatarURL:",
            replacement: [
                {
                    match: /(getUserAvatarURL:)(\i),/,
                    replace: "$1$self.getAvatarHook($2),"
                }
            ]
        }
    ],
    getAvatarHook: (original: any) => (user: User, animated: boolean, size: number) => {
        if (settings.store.preferNitro && user.avatar?.startsWith("a_")) return original(user, animated, size);

        return data.avatars[user.id] ?? original(user, animated, size);
    },
    async start() {
        const res = await fetch(settings.store.urlForDB);
        if (res.ok) this.data = data = await res.json();
    }
});
