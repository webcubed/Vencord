/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { Devs } from "@utils/constants";
import { getCurrentChannel, getCurrentGuild, sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { ButtplugBrowserWebsocketClientConnector, ButtplugClient, ButtplugClientDevice, ButtplugDeviceError } from "buttplug";

let client: ButtplugClient | null = null;
let connector: ButtplugBrowserWebsocketClientConnector;
let batteryIntervalId: NodeJS.Timeout | null = null;
let vibrateQueue: VibrateEvent[] = [];
const recentlyHandledMessages: string[] = [];

const pluginSettings = definePluginSettings({
    connectAutomatically: {
        type: OptionType.BOOLEAN,
        description: "If true, it will connect to intiface on startup (With this off, you need to re-enable the plugin to reconnect)",
        default: true,
    },
    rampUpAndDown: {
        type: OptionType.BOOLEAN,
        description: "If true, it will try and smoothly ramp the vibration intensity up and down",
        default: true,
    },
    rampUpAndDownSteps: {
        type: OptionType.SLIDER,
        description: "How many steps to use when ramping up and down (Default: 20)\nHigher steps will add more delay",
        markers: makeRange(0, 40, 1),
        stickToMarkers: true,
        default: 20,
    },
    websocketUrl: {
        type: OptionType.STRING,
        description: "The URL of the websocket server",
        default: "ws://localhost:12345",
        onChange: () => {
            handleDisconnection();
            handleConnection();
        },
        isValid: (value: string) => {
            if (!value) return "Please enter a URL";
            if (!/^wss?:\/\/[^\s/$.?#].[^\s]*$/.test(value)) return "Invalid URL provided. Expected format: ws://127.0.0.1:12345";
            return true;
        },
    },
    maxVibrationIntensity: {
        type: OptionType.SLIDER,
        description: "Maximum intensity of vibration",
        markers: makeRange(0, 100, 10),
        stickToMarkers: false,
        default: 70,
    },
    maxQueuedEvents: {
        type: OptionType.SLIDER,
        description: "Maximum number of queued vibrations",
        markers: makeRange(0, 100, 5),
        stickToMarkers: true,
        default: 100,
    },
    targetWords: {
        type: OptionType.STRING,
        description: "Comma-separated list of words to use as targets (used for detecting things when you was not mentioned)",
        default: ""
    },
    triggerWords: {
        type: OptionType.STRING,
        description: "Comma-separated list of words to use as triggers",
        default: ""
    },
    addOnWords: {
        type: OptionType.STRING,
        description: "Comma-separated list of words to add to the trigger words (increases vibration per word)",
        default: ""
    },
    switchBlacklistToWhitelist: {
        type: OptionType.BOOLEAN,
        description: "If true, will switch the blacklist to a whitelist",
        default: false,
    },
    listedUsers: {
        type: OptionType.STRING,
        description: "Comma-separated list of user IDs to blacklist/whitelist",
        default: ""
    },
    listedChannels: {
        type: OptionType.STRING,
        description: "Comma-separated list of channel IDs to blacklist/whitelist",
        default: ""
    },
    listedGuilds: {
        type: OptionType.STRING,
        description: "Comma-separated list of guild IDs to blacklist/whitelist",
        default: ""
    },
    altOptions: {
        type: OptionType.SELECT,
        description: "Alternative options to use",
        default: "none",
        options: [
            {
                value: "none",
                label: "None (Default)",
            },
            {
                value: "dmOnly",
                label: "DM Only",
            },
            {
                value: "currentChannelOnly",
                label: "Current Channel Only",
            },
            {
                value: "currentGuildOnly",
                label: "Current Guild Only",
            },
        ],
    },
    allowDirectUserControl: {
        type: OptionType.BOOLEAN,
        description: "Allow other users to directly control your toy",
        default: false,
    },
    directControlAllowedUsers: {
        type: OptionType.STRING,
        description: "User IDs to grant command access to",
        default: ""
    },
    directControlCommandPrefix: {
        type: OptionType.STRING,
        description: "The prefix for the command to be used",
        default: ">.",
        onChange(newValue: string) {
            if (!newValue || newValue === "") {
                pluginSettings.store.directControlCommandPrefix = ">.";
            }
        },
    }
});

export default definePlugin({
    name: "Venplug",
    description: "Detects words in messages and uses them to control a buttplug device",
    authors: [
        { name: "KaydaFox", id: 717329527696785408n },
        { name: "danthebitshifter", id: 1063920464029818960n },
        Devs.F53
    ],
    settings: pluginSettings,
    start() {
        if (pluginSettings.store.connectAutomatically)
            handleConnection();
    },
    stop() {
        handleDisconnection();
    },
    flux: {
        MESSAGE_CREATE: (payload: FluxMessageCreate) => {
            handleMessage(payload.message);
        },
    },
    commands: [
        {
            name: "connect",
            description: "Connect to the intiface server.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_opts, ctx) => {
                if (client && client.connected)
                    return sendBotMessage(ctx.channel.id, { content: "Already connected to intiface." });
                sendBotMessage(ctx.channel.id, { content: "Connecting to intiface..." });
                await handleConnection();
            }
        },
        {
            name: "disconnect",
            description: "Disconnect from the intiface server.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_opts, ctx) => {
                if (client && !client.connected)
                    return sendBotMessage(ctx.channel.id, { content: "You are not connected to intiface." });
                sendBotMessage(ctx.channel.id, { content: "Disconnecting from intiface..." });
                await handleDisconnection();
            }
        },
        {
            name: "start_scanning",
            description: "Start scanning for devices on the intiface server.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [{
                name: "auto-stop",
                description: "Auto-stop scanning after 30 seconds. If disabled, use `/stop_scanning` to stop scanning. (Default: true)",
                type: ApplicationCommandOptionType.BOOLEAN,
                required: false,
            }],
            execute: async (_opts, ctx) => {
                if (!client || !client.connected)
                    return sendBotMessage(ctx.channel.id, { content: "You are not connected to intiface." });

                await client.startScanning();
                const message = sendBotMessage(ctx.channel.id, { content: "Started scanning for devices." });

                if (findOption(_opts, "auto-stop", true) !== true) return;
                setTimeout(async () => {
                    await client?.stopScanning();
                    message.content = "Finished scanning for devices.";
                    FluxDispatcher.dispatch({ type: "MESSAGE_UPDATE", message });
                }, 30000);
            }
        },
        {
            name: "stop_scanning",
            description: "Stop scanning for devices on the intiface server.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_opts, ctx) => {
                if (!client || !client.connected)
                    return sendBotMessage(ctx.channel.id, { content: "You are not connected to intiface" });
                await client.stopScanning();
                sendBotMessage(ctx.channel.id, { content: "Stopped scanning for devices" });
            }
        },
        {
            name: "words",
            description: "Send all your trigger words.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_opts, ctx) => {
                const triggerWords = pluginSettings.store.triggerWords.split(",");
                const addOnWords = pluginSettings.store.addOnWords.split(",");
                const targetWords = pluginSettings.store.targetWords.split(",");

                sendMessage(ctx.channel.id, { content: `**Target words:** ${targetWords.join(", ")}\n\n**Trigger words:** ${triggerWords.join(", ")}\n\n**Add-on words:** ${addOnWords.join(", ")}` });
            }
        },
        {
            name: "test",
            description: "Test the vibration of all currently connected devices.",
            options: [
                {
                    name: "intensity",
                    description: "The intensity to use. (0 - 100) (Default: 30%)",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: false,
                },
                {
                    name: "duration",
                    description: "The duration to use in ms. (1000 = 1 second) (Default: 2000)",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: false,
                }
            ],
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (opts, _ctx) => {
                const intensity = findOption(opts, "intensity", 30);
                const duration = findOption(opts, "duration", 2000);
                await addToVibrateQueue(<VibrateEvent>{ duration, strength: intensity / 100 });
            }
        },
        {
            name: "devices",
            description: "List all connected devices.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "send_to_channel",
                    description: "Send the list to the current channel. (Default: false)",
                    type: ApplicationCommandOptionType.BOOLEAN,
                    required: false,
                }
            ],
            execute: async (_opts, ctx) => {
                const content = await devicesString();
                if (findOption(_opts, "send_to_channel"))
                    sendMessage(ctx.channel.id, { content });
                else
                    sendBotMessage(ctx.channel.id, { content });
            }
        }
    ]
});

async function handleMessage(message: DiscordMessage) {
    if (message.author.bot) return;
    if (message.state && message.state === "SENDING") return;

    if (recentlyHandledMessages.includes(message.id)) return;
    recentlyHandledMessages.push(message.id);
    if (recentlyHandledMessages.length > 99) recentlyHandledMessages.shift();

    const options = pluginSettings.store;

    const authorId = message.author.id;
    const content = message.content.toLowerCase();
    const currentUser = Vencord.Webpack.Common.UserStore.getCurrentUser();

    // text commands
    if (options.allowDirectUserControl && content.startsWith(options.directControlCommandPrefix)) {
        const directControlUsers: string[] = options.directControlAllowedUsers.split(" ") ?? [];
        if (authorId !== currentUser.id && !directControlUsers.includes(authorId)) return;

        const command = content.replace(options.directControlCommandPrefix, "").split(" "); // vibrate 1 20 // vibrate 20
        handleTextCommand(command.shift()!, command, message.channel_id);
        return;
    }

    if (authorId === currentUser.id) return;

    if (options.altOptions === "dmOnly" && message.guild_id) return;
    if (options.altOptions === "currentChannelOnly" && message.channel_id !== getCurrentChannel().id) return;
    if (options.altOptions === "currentGuildOnly" && (!message.guild_id || message.guild_id !== getCurrentGuild()?.id)) return;

    // ignore message if we aren't "targeted" by it
    const targetWords = options.targetWords.toLowerCase().split(",");
    if (!(!message.guild_id // In DM/Group
        || message.mentions?.some(mention => mention.id === currentUser.id) // Pings CurrentUser
        || message.referenced_message?.author.id === currentUser.id // Replies to CurrentUser
        || content.includes(currentUser.username) // contains CurrentUser's username
        || targetWords.some(targetWord => content.includes(targetWord)))) // includes a "target word"
        return;

    // user/channel/guild whitelist/blacklist
    // ! the whole white/blacklist system is confusing and this code is confusing because of it
    const listedUsers = options.listedUsers.split(",");
    const listedChannels = options.listedChannels.split(",");
    const listedGuilds = options.listedGuilds.split(",");

    const isUserListed = listedUsers.includes(authorId);
    const isChannelListed = listedChannels.includes(message.channel_id);
    const isGuildListed = message.guild_id && listedGuilds.includes(message.guild_id);

    const shouldIncludeMessage = options.switchBlacklistToWhitelist
        ? isUserListed || isChannelListed || isGuildListed
        : !isUserListed && !isChannelListed && !isGuildListed;
    if (!shouldIncludeMessage) return;

    // duration/strength calculation
    const triggerWords = options.triggerWords.toLowerCase().split(",");
    const addOnWords = options.addOnWords.toLowerCase().split(",");

    let strength = 0;
    let duration = 0;
    triggerWords.forEach(triggerWord => {
        if (!content.includes(triggerWord)) return;
        strength += 19;
        duration += 2000;
    });
    if (strength === 0) return;

    addOnWords.forEach(addOnWord => {
        if (!content.includes(addOnWord)) return;
        strength += 7.5;
        duration += 250;
    });

    addToVibrateQueue({ strength: cleanStrength(strength), duration });
}

async function handleTextCommand(command: string, args: string[], channelId: string) {
    const respond = (content: string) => sendMessage(channelId, { content });

    if (!client || !client.connected) return respond("My client isn't connected right now.");

    const { directControlCommandPrefix } = pluginSettings.store;

    switch (command) {
        case "v":
        case "vibrate": {
            let strength = Number(args.pop());
            const deviceId = Number(args.pop());
            if (isNaN(strength))
                return respond(`Incorrect arguments provided. \n**Correct usages**\nAll devices: ${directControlCommandPrefix}vibrate 20\nSpecific device: ${directControlCommandPrefix}vibrate 1 20\narguments: vibrate <deviceId?> <amount>`);

            if (strength < 0) return respond("Invalid vibration strength");
            strength = cleanStrength(strength);

            if (!isNaN(deviceId)) {
                if (client.devices.length > deviceId || deviceId < 1) return respond("Invalid device ID");
                return client.devices[deviceId - 1].vibrate(strength);
            }
            return client.devices.forEach(device => device.vibrate(strength));
        }

        case "durationVibration":
        case "vibrationDuration":
        case "vd": {
            const duration = Number(args.pop());
            let strength = Number(args.pop());
            const deviceId = Number(args.pop());

            if (isNaN(duration) || isNaN(strength))
                return respond(`Incorrect arguments provided. \n**Correct usages**\nAll devices: ${directControlCommandPrefix}vibrate 20 2000\nSpecific device: ${directControlCommandPrefix}vibrate 1 20 2000\narguments: vibrate <deviceId?> <amount> <timeInMilliseconds>`);

            if (strength < 0) return respond("Invalid vibration strength");
            strength = cleanStrength(strength);

            if (!isNaN(deviceId)) {
                if (client.devices.length > deviceId || deviceId < 1) return respond("Invalid device ID");
                return addToVibrateQueue({ strength, duration, deviceId: deviceId - 1 });
            }

            return addToVibrateQueue({ strength: strength, duration });
        }

        case "d":
        case "devices": {
            return respond(`**Connected devices:**\n${await Promise.all(client.devices.map(async (device, i) =>
                `**ID:** ${i + 1}, **Name:** ${device.name}, **Battery:** ${device.hasBattery ? `${await device.battery() * 100}%` : "No battery"}`
            )).then(a => a.join("\n"))}`);
        }
    }
}

async function handleDisconnection() {
    try {
        vibrateQueue = [];
        if (client && client.connected) await client.disconnect();
        client = null;
        if (batteryIntervalId) clearInterval(batteryIntervalId);

        showNotification({
            title: "Disconnected from intiface",
            body: "You are now disconnected from intiface.",
            permanent: false,
            noPersist: false,
        });
    } catch (error) {
        console.error(error);
    }
}

async function handleConnection() {
    try {
        if (!pluginSettings.store.websocketUrl) {
            return showNotification({
                title: "No URL provided for intiface",
                body: "Please provide a URL in the settings. Connecting to intiface has been disabled.",
                permanent: false,
                noPersist: false,
            });
        }

        connector = new ButtplugBrowserWebsocketClientConnector(pluginSettings.store.websocketUrl);
        if (!client)
            client = new ButtplugClient("Vencord");

        client.addListener("deviceadded", async (device: ButtplugClientDevice) => {
            device.warnedLowBattery = false;

            showNotification({
                title: `Device added (Total devices: ${client?.devices.length})`,
                body: `A device named "${device.name}" was added ${device.hasBattery && `and has a battery level of ${await device.battery() * 100}%`}`,
                permanent: false,
                noPersist: false,
            });

            if (device.vibrateAttributes.length === 0)
                return;

            try {
                await device.vibrate(0.1);
                await new Promise(r => setTimeout(r, 500));
                await device.stop();
            } catch (error) {
                console.log(error);
                if (error instanceof ButtplugDeviceError) {
                    console.log("got a device error!");
                }
            }
        });

        client.addListener("deviceremoved", (device: ButtplugClientDevice) => {
            showNotification({
                title: "Device removed",
                body: `A device named "${device.name}" was removed`,
                permanent: false,
                noPersist: false,
            });
        });

        await client.connect(connector).then(() => console.log("Buttplug.io connected"));

        checkDeviceBattery();

        showNotification({
            title: "Connected to intiface",
            body: "You are now connected to intiface.",
            permanent: false,
            noPersist: false,
        });
    } catch (error) {
        console.error(error);
        showNotification({
            title: "Failed to connect to intiface",
            body: "Failed to connect to intiface. Please check the console for more information.",
            permanent: false,
            noPersist: false,
        });
    }
}

async function checkDeviceBattery() {
    if (!client) return;
    batteryIntervalId = setInterval(async () => {
        client!.devices.forEach(async (device: ButtplugClientDevice) => {
            if (!device.hasBattery || device.warnedLowBattery) return;

            const battery = await device.battery();
            if (battery >= 0.1) return;
            device.warnedLowBattery = true;
            showNotification({
                title: "Device battery low",
                body: `The battery of device "${device.name}" is low (${battery * 100}%)`,
                permanent: false,
                noPersist: false,
            });
        });
    }, 60000); // 1 minute
}

async function addToVibrateQueue(data: VibrateEvent) {
    if (vibrateQueue.length > pluginSettings.store.maxQueuedEvents)
        return;

    vibrateQueue.push(data);
    if (vibrateQueue.length === 1)
        processVibrateQueue();
}

async function processVibrateQueue() {
    if (vibrateQueue.length === 0)
        return;

    const data = vibrateQueue[0];

    try {
        await handleVibrate(data);
    } catch (error) {
        console.error("Error in handleVibrate:", error);
    } finally {
        vibrateQueue.shift();

        processVibrateQueue();
    }
}

async function handleVibrate(data: VibrateEvent) {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    if (!client || !client.devices) return;

    const devices = data.deviceId ? [client.devices[data.deviceId]] : client.devices;
    if (!pluginSettings.store.rampUpAndDown) {
        await vibrateDevices(devices, data.strength);
        await sleep(data.duration);
        stopDevices(devices);
        return;
    }

    data.duration += 1250;
    const steps = pluginSettings.store.rampUpAndDownSteps;
    const rampLength = data.duration * 0.2 / steps;
    let startIntensity = 0;
    let endIntensity = data.strength;
    let stepIntensity = (endIntensity - startIntensity) / steps;

    for (let i = 0; i <= steps; i++) {
        await vibrateDevices(devices, startIntensity + (stepIntensity * i));
        await sleep(rampLength);
    }

    await sleep(data.duration * 0.54);

    startIntensity = data.strength;
    endIntensity = 0;

    stepIntensity = (endIntensity - startIntensity) / steps;

    for (let i = 0; i <= steps; i++) {
        await vibrateDevices(devices, startIntensity + (stepIntensity * i));
        await sleep(rampLength);
    }
    stopDevices(devices);
}
async function stopDevices(devices: ButtplugClientDevice[]) {
    for (const device of devices) {
        await device.stop();
    }

}
async function vibrateDevices(devices: ButtplugClientDevice[], intensity: number) {
    for (const device of devices) {
        await device.vibrate(intensity);
    }
}

// scales down 0-100 to 0-maxVibrationIntensity
function cleanStrength(strength: number) {
    if (strength < 0) strength = 0;
    if (strength > 100) strength = 100;
    strength *= (pluginSettings.store.maxVibrationIntensity / 100);
    return strength /= 100;
}

async function devicesString() {
    if (!client) return "Not connected to intiface";
    if (client.devices.length === 0) return "No connected devices";

    const devices = await Promise.all(client.devices.map(async (device, i) =>
        `**ID:** ${i + 1}, **Name:** ${device.name}, **Battery:** ${device.hasBattery ? `${await device.battery() * 100}%` : "No battery"}`
    ));

    return `**Connected devices:**\n${devices.join("\n")}`;
}

interface FluxMessageCreate {
    type: "MESSAGE_CREATE";
    channelId: string;
    guildId?: string;
    isPushNotification: boolean;
    message: DiscordMessage;
    optimistic: boolean;
}

interface DiscordMessage {
    content: string;
    mentions?: DiscordUser[];
    member: DiscordUser;
    message_reference?: {
        channel_id: string;
        guild_id: string;
        message_id: string;
    };
    referenced_message?: DiscordMessage;
    author: DiscordUser;
    guild_id?: string;
    channel_id: string;
    id: string;
    type: number;
    channel: {
        id: string;
    };
    state?: string;
}

interface DiscordUser {
    avatar: string;
    username: string;
    id: string;
    bot: boolean;
}

declare module "buttplug" {
    interface ButtplugClientDevice {
        warnedLowBattery: boolean;
    }
}

type VibrateEvent = {
    duration: number,
    strength: number,
    deviceId?: number;
};
