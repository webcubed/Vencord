/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs, EquicordDevs } from "@utils/constants";
import { getTheme, Theme } from "@utils/discord";
import { classes } from "@utils/misc";
import definePlugin from "@utils/types";
import { findByProps, findExportedComponentLazy } from "@webpack";
import { Button, FluxDispatcher, RestAPI, Tooltip, UserStore } from "@webpack/common";
const HeaderBarIcon = findExportedComponentLazy("Icon", "Divider");
const isApp = navigator.userAgent.includes("Electron/");

function ToolBarQuestsIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            className={classes("vc-quest-completer-icon")}
            viewBox="0 0 15 15"
        >
            <path
                fill="currentColor"
                d="M 11.54 11.92 L 13.32 12.9 L 12.46 14.48 L 10.52 13.04 A 6.252 6.252 0 0 1 9.322 13.823 A 7.504 7.504 0 0 1 8.78 14.07 Q 7.78 14.48 6.5 14.48 A 6.964 6.964 0 0 1 4.93 14.31 A 5.746 5.746 0 0 1 3.77 13.91 Q 2.56 13.34 1.72 12.35 A 6.826 6.826 0 0 1 0.526 10.285 A 7.857 7.857 0 0 1 0.44 10.04 Q 0 8.72 0 7.22 A 9.35 9.35 0 0 1 0.22 5.153 A 7.663 7.663 0 0 1 0.78 3.53 Q 1.56 1.9 3.01 0.95 A 5.732 5.732 0 0 1 5.225 0.102 A 7.655 7.655 0 0 1 6.5 0 A 7.084 7.084 0 0 1 8.07 0.168 A 5.816 5.816 0 0 1 9.23 0.56 Q 10.44 1.12 11.28 2.12 A 7.2 7.2 0 0 1 12.569 4.418 A 9.549 9.549 0 0 1 12.57 4.42 A 8.288 8.288 0 0 1 13.004 6.665 A 9.643 9.643 0 0 1 13.02 7.22 A 9.325 9.325 0 0 1 12.936 8.507 Q 12.841 9.186 12.64 9.766 A 5.548 5.548 0 0 1 12.58 9.93 Q 12.14 11.08 11.54 11.92 Z M 9.1 12.14 L 7.58 11.18 L 8.38 9.72 L 10.18 11.02 Q 10.66 10.24 10.87 9.31 A 8.288 8.288 0 0 0 11.034 8.257 A 11.143 11.143 0 0 0 11.08 7.22 Q 11.08 6.14 10.77 5.14 A 5.929 5.929 0 0 0 10.013 3.551 A 5.561 5.561 0 0 0 9.87 3.35 Q 9.28 2.56 8.43 2.1 A 3.833 3.833 0 0 0 6.97 1.663 A 4.738 4.738 0 0 0 6.5 1.64 A 4.737 4.737 0 0 0 5.262 1.795 A 3.768 3.768 0 0 0 4.04 2.37 A 4.51 4.51 0 0 0 2.661 3.979 A 5.506 5.506 0 0 0 2.48 4.36 A 6.618 6.618 0 0 0 2.01 6.114 A 8.493 8.493 0 0 0 1.94 7.22 Q 1.94 8.3 2.24 9.31 Q 2.54 10.32 3.12 11.12 Q 3.7 11.92 4.54 12.38 Q 5.38 12.84 6.46 12.84 A 5.835 5.835 0 0 0 7.289 12.784 A 4.587 4.587 0 0 0 7.95 12.64 Q 8.609 12.443 9.084 12.15 A 3.467 3.467 0 0 0 9.1 12.14 Z"
            />
        </svg>
    );
}

function ToolBarHeader() {
    return (
        <ErrorBoundary noop={true}>
            <HeaderBarIcon
                tooltip="Complete Quest"
                position="bottom"
                className="vc-quest-completer"
                icon={ToolBarQuestsIcon}
                onClick={openCompleteQuestUI}
            >
            </HeaderBarIcon>
        </ErrorBoundary>
    );
}

async function openCompleteQuestUI() {
    const ApplicationStreamingStore = findByProps("getStreamerActiveStreamMetadata");
    const RunningGameStore = findByProps("getRunningGames");
    const QuestsStore = findByProps("getQuest");
    const quest = [...QuestsStore.quests.values()].find(x => x.id !== "1248385850622869556" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now());

    if (!quest) {
        showNotification({
            title: "Quest Completer",
            body: "No Quests To Complete",
        });
    } else {
        const pid = Math.floor(Math.random() * 30000) + 1000;
        const theme = getTheme() === Theme.Light
            ? "light"
            : "dark";

        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP"].find(x => quest.config.taskConfig.tasks[x] != null);
        // @ts-ignore
        const secondsNeeded = quest.config.taskConfig.tasks[taskName].target;
        // @ts-ignore
        const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        const icon = `https://cdn.discordapp.com/assets/quests/${quest.id}/${theme}/${quest.config.assets.gameTile}`;
        if (taskName === "WATCH_VIDEO") {
            const tolerance = 2, speed = 10;
            const diff = Math.floor((Date.now() - new Date(quest.userStatus.enrolledAt).getTime()) / 1000);
            const startingPoint = Math.min(Math.max(Math.ceil(secondsDone), diff), secondsNeeded);
            const fn = async () => {
                for (let i = startingPoint; i <= secondsNeeded; i += speed) {
                    try {
                        await RestAPI.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: Math.min(secondsNeeded, i + Math.random()) } });
                    } catch (ex) {
                        console.log("Failed to send increment of", i, ex);
                    }
                    await new Promise(resolve => setTimeout(resolve, tolerance * 1000));
                }
                if ((secondsNeeded - secondsDone) % speed !== 0) {
                    await RestAPI.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
                    showNotification({
                        title: `${applicationName} - Quest Completer`,
                        body: "Quest completed!",
                        icon: icon,
                    });
                }
            };
            fn();
            showNotification({
                title: `${applicationName} - Quest Completer`,
                body: `Wait for ${Math.ceil((secondsNeeded - startingPoint) / speed * tolerance)} more seconds.`,
                icon: icon,
            });
            console.log(`Spoofing video for ${applicationName}.`);
        } else if (taskName === "PLAY_ON_DESKTOP") {
            if (!isApp) {
                showNotification({
                    title: `${applicationName} - Quest Completer`,
                    body: `${applicationName}'s quest requires the desktop app.`,
                    icon: icon,
                });
            }
            RestAPI.get({ url: `/applications/public?application_ids=${applicationId}` }).then(res => {
                const appData = res.body[0];
                const exeName = appData.executables.find(x => x.os === "win32").name.replace(">", "");

                const games = RunningGameStore.getRunningGames();
                const fakeGame = {
                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                    exeName,
                    exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                    hidden: false,
                    isLauncher: false,
                    id: applicationId,
                    name: appData.name,
                    pid: pid,
                    pidPath: [pid],
                    processName: appData.name,
                    start: Date.now(),
                };
                games.push(fakeGame);
                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [], added: [fakeGame], games: games });

                const fn = data => {
                    const progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                    showNotification({
                        title: `${applicationName} - Quest Completer`,
                        body: `Current progress: ${progress}/${secondsNeeded} seconds.`,
                        icon: icon,
                    });

                    if (progress >= secondsNeeded) {
                        showNotification({
                            title: `${applicationName} - Quest Completer`,
                            body: "Quest completed!",
                            icon: icon,
                        });

                        const idx = games.indexOf(fakeGame);
                        if (idx > -1) {
                            games.splice(idx, 1);
                            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                        }
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                console.log(`Spoofed your game to ${applicationName}.`);
            });
        } else if (taskName === "STREAM_ON_DESKTOP") {
            if (!isApp) {
                showNotification({
                    title: `${applicationName} - Quest Completer`,
                    body: `${applicationName}'s quest requires the desktop app.`,
                    icon: icon,
                });
            }
            const stream = ApplicationStreamingStore.getAnyStreamForUser(UserStore.getCurrentUser()?.id);
            if (!stream) {
                showNotification({
                    title: "You're not streaming - Quest Completer",
                    body: `${applicationName} requires you to be streaming.\nPlease stream any window in a voice channel.`,
                    icon: icon,
                });
            }
            showNotification({
                title: `${applicationName} - Quest Completer`,
                body: "There needs to be at least 1 other person in the voice channel!",
                icon: icon,
            });
            const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                id: applicationId,
                pid,
                sourceName: null
            });

            const fn = data => {
                const progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                showNotification({
                    title: `${applicationName} - Quest Completer`,
                    body: `Current progress: ${progress}/${secondsNeeded} seconds.`,
                    icon: icon,
                });

                if (progress >= secondsNeeded) {
                    showNotification({
                        title: `${applicationName} - Quest Completer`,
                        body: "Quest completed!",
                        icon: icon,
                    });

                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                }
            };
            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            console.log(`Spoofed your stream to ${applicationName}.`);
        }
        return;
    }
}

export default definePlugin({
    name: "QuestCompleter",
    description: "A plugin that allows you to complete quests without the need to have the game installed",
    authors: [Devs.HappyEnderman, EquicordDevs.SerStars, EquicordDevs.thororen],
    patches: [
        {
            find: "\"invite-button\"",
            replacement: {
                match: /(\i\.Fragment,{children:)(\i\i)/,
                replace: "$1[$self.renderQuestButton(),...$2]"
            }
        },
        {
            find: "toolbar:function",
            replacement: {
                match: /(function \i\(\i\){)(.{1,200}toolbar.{1,200}mobileToolbar)/,
                replace: "$1$self.toolbarAction(arguments[0]);$2"
            }
        }
    ],
    renderQuestButton() {
        return (
            <Tooltip text="Complete Quest">
                {tooltipProps => (
                    <Button style={{ backgroundColor: "transparent" }}
                        {...tooltipProps}
                        size={"25"}
                        className={"vc-quest-completer-icon"}
                        onClick={openCompleteQuestUI}
                    >
                        <ToolBarQuestsIcon />
                    </Button>
                )}
            </Tooltip>
        );
    },
    toolbarAction(e) {
        if (Array.isArray(e.toolbar))
            return e.toolbar.push(
                <ErrorBoundary noop={true}>
                    <ToolBarHeader />
                </ErrorBoundary>
            );

        e.toolbar = [
            <ErrorBoundary noop={true}>
                <ToolBarHeader />
            </ErrorBoundary>,
            e.toolbar,
        ];
    }
});
