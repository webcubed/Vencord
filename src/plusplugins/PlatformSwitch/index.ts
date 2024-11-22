/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated, Samu and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import definePlugin, {StartAt,} from "@utils/types";
import {settings} from "./libs/settings";
import {Platforms} from "./types/Platforms";
import {IdentifyPacket} from "./types/IdentifyPacket";
import {Logger} from "./libs/Logger";
import {ActivityPacket} from "./types/ActivityPacket";

export default definePlugin({
    name: "PlatformSwitch",
    description: "Switch client platform",
    authors: [
        {
            id: 973926908276400198n,
            name: "Aggelos",

        },
        {
            id: 1093609255623475270n,
            name: "Xou09"
        }
    ],
    startAt: StartAt.DOMContentLoaded /* Init, DOMContentLoaded*/,
    settings: settings,
    start: async function () {
        const logger: Logger = new Logger(this.name)
        let nativeSupport: boolean = false //Possibly will use this for the future?
        logger.Log("DEBUG", `Checking if client is DiscordNative`)
        try {
            const type = typeof DiscordNative
            if (type === "undefined") {
                nativeSupport = false
                logger.Log("DEBUG", `Client does support DiscordNative`)
            } else {
                if (DiscordNative.nativeModules && DiscordNative.nativeModules.requireModule("discord_erlpack")) {
                    nativeSupport = true
                    logger.Log("DEBUG", `Client does support DiscordNative`)
                }
            }
        } catch (e) {
            nativeSupport = false
            logger.Log("DEBUG", `Client does not support DiscordNative`)
        }
        let Erl;

        if (nativeSupport) Erl = DiscordNative.nativeModules.requireModule("discord_erlpack");

        WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, {
            async apply(target: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void, thisArg: WebSocket, argArray: any[]): Promise<any> {
                if (thisArg.url.includes("wss://gateway") && thisArg.url.includes("discord.gg")) {
                    let data!: IdentifyPacket
                    let isETF: boolean = false
                    if (thisArg.url.includes("?encoding=etf")) {
                        isETF = true
                        data = Erl.unpack(new Uint8Array(argArray[0]))
                    } else if (thisArg.url.includes("?encoding=json")) {
                        data = JSON.parse(argArray[0])
                    }
                    logger.Log("DEBUG", "Hooked send function");
                    try {
                        if (data.op === 2) {
                            logger.Log("DEBUG", "Hooking IDENTIFY packet");
                            if (settings.store.platform == Platforms.android) {
                                data.d.properties["os"] = "Android";
                                data.d.properties["browser"] = "Discord Android";
                                data.d.properties["device"] = "Samsung Galaxy";
                                data.d.properties["browser_user_agent"] =
                                    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
                                data.d.properties["browser_version"] = "126.0.0.0";
                                data.d.properties["os_version"] = "34";
                            } else if (settings.store.platform == Platforms.xbox || settings.store.platform == Platforms.ps5) {
                                data.d.properties["os"] = "Embedded";
                                data.d.properties["browser"] = "Discord Embedded";
                                data.d.properties["device"] = "";
                                data.d.properties["browser_user_agent"] =
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) PlayStation Chrome/48.0.2564.82 Safari/537.36 Edge/20.02";
                                data.d.properties["browser_version"] = "126.0.0.0";
                                data.d.properties["os_version"] = "";
                            } else if (settings.store.platform == Platforms.web) {
                                data.d.properties["os"] = "Windows";
                                data.d.properties["browser"] = "Chrome";
                                data.d.properties["device"] = "";
                                data.d.properties["browser_user_agent"] =
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 GLS/100.10.9939.100"
                                data.d.properties["browser_version"] = "125.0.0.0";
                                data.d.properties["os_version"] = "10";
                            } else if (settings.store.platform == Platforms.desktop) {
                                data.d.properties["os"] = "Windows";
                                data.d.properties["browser"] = "Discord Client";
                                data.d.properties["browser_version"] = "30.1.0";
                                data.d.properties["os_arch"] = "x64"
                                data.d.properties["app_arch"] = "x64"
                                data.d.properties["browser_user_agent"] =
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9152 Chrome/124.0.6367.243 Electron/30.1.0 Safari/537.36"
                                data.d.properties["os_version"] = "10.0.19045";
                            }

                        } else if (data.op == 3) {
                            logger.Log("DEBUG", "Hooked activities")
                            if (data.d.hasOwnProperty("activities")) {
                                const activityPacket: ActivityPacket = data.d as unknown as ActivityPacket
                                for (const activity of activityPacket["d"]["activities"]) {
                                    if (activity["type"] == 0 || activity["type"] == 2) {
                                        if (settings.store.platform === Platforms.ps5) {
                                            logger.Log("INFO", `[${activity["name"]}]: Setting platform to ps5`)
                                            activity["platform"] = "ps5"
                                        } else if (settings.store.platform === Platforms.xbox) {
                                            logger.Log("INFO", `[${activity["name"]}]: Setting platform to xbox`)
                                            activity["platform"] = "xbox"
                                        }
                                    }
                                }
                            }
                        }
                        if (isETF) {
                            argArray[0] = Erl.pack(data);
                        } else {
                            argArray[0] = JSON.stringify(data);
                        }
                    } catch (e) {
                        logger.Log("ERROR", `Couldn't parse data. Reason: ${e}`)
                    }
                }
                return Reflect.apply(target, thisArg, argArray);
            },
        });
    },
    stop() {
    },
});
