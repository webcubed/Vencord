/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, Settings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { getUserSettingLazy } from "@api/UserSettings";
import ErrorBoundary from "@components/ErrorBoundary";
import { ErrorCard } from "@components/ErrorCard";
import { Link } from "@components/Link";
import { Devs } from "@utils/constants";
import { isTruthy } from "@utils/guards";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { findByCodeLazy, findComponentByCodeLazy } from "@webpack";
import { ApplicationAssetUtils, Button, FluxDispatcher, Forms, GuildStore, React, SelectedChannelStore, SelectedGuildStore, UserStore } from "@webpack/common";

import style from "./style.css?managed";
const Toggle = findComponentByCodeLazy("Button.Sizes.NONE,disabled:");
const useProfileThemeStyle = findByCodeLazy("profileThemeStyle:", "--profile-gradient-primary-color");
const ActivityComponent = findComponentByCodeLazy("onOpenGameProfile");

const ShowCurrentGame = getUserSettingLazy<boolean>("status", "showCurrentGame")!;

function makeIcon(showCurrentGame?: boolean) {
    const { oldIcon } = settings.use(["oldIcon"]);

    const starPath = "M12 2L14.09 8.09L21 8.5L15.5 12.36L17.09 19L12 15.5L6.91 19L8.5 12.36L3 8.5L9.91 8.09L12 2Z";

    const redLinePath = !oldIcon
        ? "M22.7 2.7a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4Z"
        : "M23 2.27 21.73 1 1 21.73 2.27 23 23 2.27Z";

    const maskBlackPath = !oldIcon
        ? "M23.27 4.73 19.27 .73 -.27 20.27 3.73 24.27Z"
        : "M23.27 4.54 19.46.73 .73 19.46 4.54 23.27 23.27 4.54Z";

    return function () {
        return (
            <svg width="26" height="26" viewBox="0 0 26 26">
                <path
                    fill={!showCurrentGame && !oldIcon ? "var(--status-danger)" : "currentColor"}
                    d={starPath}
                />
                {!showCurrentGame && <>
                    <path fill="var(--status-danger)" d={redLinePath} />
                    {!oldIcon && (
                        <mask id="gameActivityMask">
                            <rect fill="white" x="0" y="0" width="26" height="26" />
                            <path fill="black" d={maskBlackPath} />
                        </mask>
                    )}
                </>}
            </svg>
        );
    };
}

function GameActivityToggleButton() {
    const [rpcEnabled, setRpcEnabled] = React.useState(true);

    const toggleRpc = () => {
        const newStatus = !rpcEnabled;
        setRpcEnabled(newStatus);
        setRpc(!newStatus);
    };

    return (
        <Toggle
            tooltipText={rpcEnabled ? "Disable Custom RPC" : "Enable Custom RPC"}
            icon={makeIcon(rpcEnabled)}
            role="switch"
            aria-checked={!rpcEnabled}
            onClick={toggleRpc}
        />
    );
}

async function getApplicationAsset(key: string): Promise<string> {
    if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/attachments\//.test(key)) return "mp:" + key.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
    return (await ApplicationAssetUtils.fetchAssetIds(settings.store.appID!, [key]))[0];
}

interface ActivityAssets {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
}

interface Activity {
    state?: string;
    details?: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
    assets?: ActivityAssets;
    buttons?: Array<string>;
    name: string;
    application_id: string;
    metadata?: {
        button_urls?: Array<string>;
    };
    type: ActivityType;
    url?: string;
    flags: number;
}

const enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    COMPETING = 5
}

const enum TimestampMode {
    NONE,
    NOW,
    TIME,
    CUSTOM,
}

const settings = definePluginSettings({
    appID: {
        type: OptionType.STRING,
        description: "Application ID (required)",
        onChange: onChange,
        isValid: (value: string) => {
            if (!value) return "Application ID is required.";
            if (value && !/^\d+$/.test(value)) return "Application ID must be a number.";
            return true;
        }
    },
    appName: {
        type: OptionType.STRING,
        description: "Application name (required)",
        onChange: onChange,
        isValid: (value: string) => {
            if (!value) return "Application name is required.";
            if (value.length > 128) return "Application name must be not longer than 128 characters.";
            return true;
        }
    },
    details: {
        type: OptionType.STRING,
        description: "Details (line 1)",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 128) return "Details (line 1) must be not longer than 128 characters.";
            return true;
        }
    },
    state: {
        type: OptionType.STRING,
        description: "State (line 2)",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 128) return "State (line 2) must be not longer than 128 characters.";
            return true;
        }
    },
    type: {
        type: OptionType.SELECT,
        description: "Activity type",
        onChange: onChange,
        options: [
            {
                label: "Playing",
                value: ActivityType.PLAYING,
                default: true
            },
            {
                label: "Streaming",
                value: ActivityType.STREAMING
            },
            {
                label: "Listening",
                value: ActivityType.LISTENING
            },
            {
                label: "Watching",
                value: ActivityType.WATCHING
            },
            {
                label: "Competing",
                value: ActivityType.COMPETING
            }
        ]
    },
    streamLink: {
        type: OptionType.STRING,
        description: "Twitch.tv or YouTube.com link (only for Streaming activity type)",
        onChange: onChange,
        disabled: isStreamLinkDisabled,
        isValid: isStreamLinkValid
    },
    timestampMode: {
        type: OptionType.SELECT,
        description: "Timestamp mode",
        onChange: onChange,
        options: [
            {
                label: "None",
                value: TimestampMode.NONE,
                default: true
            },
            {
                label: "Since Discord is open",
                value: TimestampMode.NOW
            },
            {
                label: "Same as your current time",
                value: TimestampMode.TIME
            },
            {
                label: "Custom",
                value: TimestampMode.CUSTOM
            }
        ]
    },
    startTime: {
        type: OptionType.NUMBER,
        description: "Start timestamp in milliseconds (only for custom timestamp mode)",
        onChange: onChange,
        disabled: isTimestampDisabled,
        isValid: (value: number) => {
            if (value && value < 0) return "Start timestamp must be greater than 0.";
            return true;
        }
    },
    endTime: {
        type: OptionType.NUMBER,
        description: "End timestamp in milliseconds (only for custom timestamp mode)",
        onChange: onChange,
        disabled: isTimestampDisabled,
        isValid: (value: number) => {
            if (value && value < 0) return "End timestamp must be greater than 0.";
            return true;
        }
    },
    imageBig: {
        type: OptionType.STRING,
        description: "Big image key/link",
        onChange: onChange,
        isValid: isImageKeyValid
    },
    imageBigTooltip: {
        type: OptionType.STRING,
        description: "Big image tooltip",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 128) return "Big image tooltip must be not longer than 128 characters.";
            return true;
        }
    },
    imageSmall: {
        type: OptionType.STRING,
        description: "Small image key/link",
        onChange: onChange,
        isValid: isImageKeyValid
    },
    imageSmallTooltip: {
        type: OptionType.STRING,
        description: "Small image tooltip",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 128) return "Small image tooltip must be not longer than 128 characters.";
            return true;
        }
    },
    buttonOneText: {
        type: OptionType.STRING,
        description: "Button 1 text",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 31) return "Button 1 text must be not longer than 31 characters.";
            return true;
        }
    },
    buttonOneURL: {
        type: OptionType.STRING,
        description: "Button 1 URL",
        onChange: onChange
    },
    buttonTwoText: {
        type: OptionType.STRING,
        description: "Button 2 text",
        onChange: onChange,
        isValid: (value: string) => {
            if (value && value.length > 31) return "Button 2 text must be not longer than 31 characters.";
            return true;
        }
    },
    buttonTwoURL: {
        type: OptionType.STRING,
        description: "Button 2 URL",
        onChange: onChange
    },
    oldIcon: {
        type: OptionType.BOOLEAN,
        description: "Use the old icon style (from before Discord's icon redesign)",
        default: false
    }
});

function onChange() {
    setRpc(true);
    if (Settings.plugins.CustomRPC.enabled) setRpc();
}

function isStreamLinkDisabled() {
    return settings.store.type !== ActivityType.STREAMING;
}

function isStreamLinkValid(value: string) {
    if (!isStreamLinkDisabled() && !/https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\/\w+/.test(value)) return "Streaming link must be a valid URL.";
    return true;
}

function isTimestampDisabled() {
    return settings.store.timestampMode !== TimestampMode.CUSTOM;
}

function isImageKeyValid(value: string) {
    if (/https?:\/\/(?!i\.)?imgur\.com\//.test(value)) return "Imgur link must be a direct link to the image. (e.g. https://i.imgur.com/...)";
    if (/https?:\/\/(?!media\.)?tenor\.com\//.test(value)) return "Tenor link must be a direct link to the image. (e.g. https://media.tenor.com/...)";
    return true;
}

async function createActivity(): Promise<Activity | undefined> {
    const {
        appID,
        appName,
        details,
        state,
        type,
        streamLink,
        startTime,
        endTime,
        imageBig,
        imageBigTooltip,
        imageSmall,
        imageSmallTooltip,
        buttonOneText,
        buttonOneURL,
        buttonTwoText,
        buttonTwoURL
    } = settings.store;

    if (!appName) return;

    const activity: Activity = {
        application_id: appID || "0",
        name: appName,
        state,
        details,
        type,
        flags: 1 << 0,
    };

    if (type === ActivityType.STREAMING) activity.url = streamLink;

    switch (settings.store.timestampMode) {
        case TimestampMode.NOW:
            activity.timestamps = {
                start: Date.now()
            };
            break;
        case TimestampMode.TIME:
            activity.timestamps = {
                start: Date.now() - (new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds()) * 1000
            };
            break;
        case TimestampMode.CUSTOM:
            if (startTime || endTime) {
                activity.timestamps = {};
                if (startTime) activity.timestamps.start = startTime;
                if (endTime) activity.timestamps.end = endTime;
            }
            break;
        case TimestampMode.NONE:
        default:
            break;
    }

    if (buttonOneText) {
        activity.buttons = [
            buttonOneText,
            buttonTwoText
        ].filter(isTruthy);

        activity.metadata = {
            button_urls: [
                buttonOneURL,
                buttonTwoURL
            ].filter(isTruthy)
        };
    }

    if (imageBig) {
        activity.assets = {
            large_image: await getApplicationAsset(imageBig),
            large_text: imageBigTooltip || undefined
        };
    }

    if (imageSmall) {
        activity.assets = {
            ...activity.assets,
            small_image: await getApplicationAsset(imageSmall),
            small_text: imageSmallTooltip || undefined
        };
    }


    for (const k in activity) {
        if (k === "type") continue;
        const v = activity[k];
        if (!v || v.length === 0)
            delete activity[k];
    }

    return activity;
}

async function setRpc(disable?: boolean) {
    const activity: Activity | undefined = await createActivity();

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: !disable ? activity : null,
        socketId: "CustomRPC",
    });
}

export default definePlugin({
    name: "CustomRPC",
    description: "Allows you to set a custom rich presence",
    authors: [Devs.captain, Devs.AutumnVN, Devs.nin0dev, Devs.LoosaZ],
    dependencies: ["UserSettingsAPI"],
    settings,

    patches: [
        {
            find: ".Messages.ACCOUNT_SPEAKING_WHILE_MUTED",
            replacement: {
                match: /this\.renderNameZone\(\).+?children:\[/,
                replace: "$&$self.GameActivityToggleButton(),"
            }
        }
    ],

    GameActivityToggleButton: ErrorBoundary.wrap(GameActivityToggleButton, { noop: true }),

    start() {
        setRpc;
        enableStyle(style);
    },
    stop: () => {
        setRpc(true);
        disableStyle(style);
    },

    settingsAboutComponent: () => {
        const activity = useAwaiter(createActivity);
        const gameActivityEnabled = ShowCurrentGame.useSetting();
        const { profileThemeStyle } = useProfileThemeStyle({});

        return (
            <>
                {!gameActivityEnabled && (
                    <ErrorCard
                        className={classes(Margins.top16, Margins.bottom16)}
                        style={{ padding: "1em" }}
                    >
                        <Forms.FormTitle>Notice</Forms.FormTitle>
                        <Forms.FormText>Game activity isn't enabled. People won't be able to see your custom rich presence!</Forms.FormText>

                        <Button
                            color={Button.Colors.TRANSPARENT}
                            className={Margins.top8}
                            onClick={() => ShowCurrentGame.updateSetting(true)}
                        >
                            Enable
                        </Button>
                    </ErrorCard>
                )}

                <Forms.FormText>
                    Go to the <Link href="https://discord.com/developers/applications">Discord Developer Portal</Link> to create an application and
                    get the application ID.
                </Forms.FormText>
                <Forms.FormText>
                    Upload images in the Rich Presence tab to get the image keys.
                </Forms.FormText>
                <Forms.FormText>
                    If you want to use an image link, download your image and upload the image to <Link href="https://imgur.com">Imgur</Link>. Get the image link by right-clicking the image and selecting "Copy image address".
                </Forms.FormText>

                <Forms.FormDivider className={Margins.top8} />

                <div style={{ width: "284px", ...profileThemeStyle, padding: 8, marginTop: 8, borderRadius: 8, background: "var(--bg-mod-faint)" }}>
                    {activity[0] && <ActivityComponent activity={activity[0]} channelId={SelectedChannelStore.getChannelId()}
                        guild={GuildStore.getGuild(SelectedGuildStore.getLastSelectedGuildId())}
                        application={{ id: settings.store.appID }}
                        user={UserStore.getCurrentUser()} />}
                </div>
            </>
        );
    }
});