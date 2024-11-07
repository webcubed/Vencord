/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export class Logger {
    private readonly pluginName: string;

    public constructor(name: string) {
        this.pluginName = name;
    }

    public Log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: any) {
        switch (level) {
            case "INFO":
                console.info(`[${this.pluginName}] [INFO]: ${message}`);
                break;
            case "WARN":
                console.warn(`[${this.pluginName}] [WARN]: ${message}`);
                break;
            case "ERROR":
                console.error(`[${this.pluginName}] [ERROR]: ${message}`);
                break;
            case "DEBUG":
                console.debug(`[${this.pluginName}] [DEBUG]: ${message}`);
                break;

        }
    }
}
