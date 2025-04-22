/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { Devs, EquicordDevs } from "@utils/constants";
import { getTheme, Theme } from "@utils/discord";
import definePlugin from "@utils/types";
import { findByProps, findComponentByCodeLazy } from "@webpack";
import { Button, ChannelStore, FluxDispatcher, GuildChannelStore, NavigationRouter, RestAPI, Tooltip, UserStore } from "@webpack/common";

const isApp = typeof DiscordNative !== "undefined";

import "./style.css";

const QuestIcon = findComponentByCodeLazy("10.47a.76.76");

async function openCompleteQuestUI() {
    const ApplicationStreamingStore = findByProps("getStreamerActiveStreamMetadata");
    const RunningGameStore = findByProps("getRunningGames");
    const QuestsStore = findByProps("getQuest");
    const quest = [...QuestsStore.quests.values()].find(x => x.id !== "1248385850622869556" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now());

    if (!quest) {
        showNotification({
            title: "Quest Completer",
            body: "No quests to complete. Click to navigate to the quests tab.",
            onClick() {
                NavigationRouter.transitionTo("/discovery/quests");
            },
        });
    } else {
        const pid = Math.floor(Math.random() * 30000) + 1000;
        const theme = getTheme() === Theme.Light
            ? "light"
            : "dark";

        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY"].find(x => quest.config.taskConfig.tasks[x] != null);
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
                const realGames = RunningGameStore.getRunningGames();
                const fakeGames = [fakeGame];
                const realGetRunningGames = RunningGameStore.getRunningGames;
                const realGetGameForPID = RunningGameStore.getGameForPID;
                RunningGameStore.getRunningGames = () => fakeGames;
                RunningGameStore.getGameForPID = pid => fakeGames.find(x => x.pid === pid);
                FluxDispatcher.dispatch({
                    type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames
                });

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

                        RunningGameStore.getRunningGames = realGetRunningGames;
                        RunningGameStore.getGameForPID = realGetGameForPID;
                        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
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
        } else if (taskName === "PLAY_ACTIVITY") {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds() as any[]).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
            const streamKey = `call:${channelId}:1`;

            const fn = async () => {

                while (true) {
                    const res = await RestAPI.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
                    const progress = res.body.progress.PLAY_ACTIVITY.value;
                    showNotification({
                        title: `${applicationName} - Quest Completer`,
                        body: `Current progress: ${progress}/${secondsNeeded} seconds.`,
                        icon: icon,
                    });

                    await new Promise(resolve => setTimeout(resolve, 20 * 1000));

                    if (progress >= secondsNeeded) {
                        await RestAPI.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                        break;
                    }
                }

                showNotification({
                    title: `${applicationName} - Quest Completer`,
                    body: "Quest completed!",
                    icon: icon,
                });
            };
            fn();
        }
        return;
    }
}

export default definePlugin({
    name: "QuestCompleter",
    description: "A plugin that allows you to complete quests without the need to have the game installed",
    authors: [Devs.amia, Devs.HappyEnderman, EquicordDevs.SerStars, EquicordDevs.thororen],
    patches: [
        {
            find: "AppTitleBar",
            replacement: {
                match: /(?<=trailing:.{0,70}\(\i\.Fragment,{children:\[.*?)\]/,
                replace: ",$self.renderQuestButton()]"
            }
        }
    ],
    renderQuestButton() {
        return (
            <Tooltip text="Complete Quest">
                {tooltipProps => (
                    <Button style={{ backgroundColor: "transparent", border: "none" }}
                        {...tooltipProps}
                        size={Button.Sizes.SMALL}
                        className={"vc-quest-completer-icon"}
                        onClick={openCompleteQuestUI}
                    >
                        <QuestIcon width={20} height={20} size={Button.Sizes.SMALL} />
                    </Button>
                )}
            </Tooltip>
        );
    },
});
