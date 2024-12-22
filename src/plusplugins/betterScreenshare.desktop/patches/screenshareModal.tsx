/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { React } from "@webpack/common";
import { Settings } from "Vencord";

import { SettingsModalCard, SettingsModalCardItem } from "../../philsPluginLibrary";
import Plugin from "..";
import { AudioSourceSelect, OpenScreenshareSettingsButton } from "../components";
import { PluginInfo } from "../constants";
import { screenshareStore } from "../stores";

const ReplacedStreamSettings = () => {
    const { use } = screenshareStore;

    const { audioSourceEnabled, setAudioSourceEnabled } = use();

    const cardProps = { style: { border: "1px solid var(--primary-800)" } };

    return (
        <div style={{ margin: "1em", display: "flex", flexDirection: "column", gap: "1em" }}>
            <SettingsModalCard cardProps={cardProps} title="Stream Settings">
                <SettingsModalCardItem>
                    <Flex flexDirection="column">
                        <OpenScreenshareSettingsButton title="Advanced Settings" />
                    </Flex>
                </SettingsModalCardItem>
            </SettingsModalCard>
            <SettingsModalCard
                cardProps={cardProps}
                switchEnabled
                switchProps={{
                    checked: audioSourceEnabled ?? false,
                    onChange: status => setAudioSourceEnabled(status)
                }}
                title="Audio Source">
                <SettingsModalCardItem>
                    <AudioSourceSelect isDisabled={!audioSourceEnabled} />
                </SettingsModalCardItem>
            </SettingsModalCard>
        </div>
    );
};

export function replacedScreenshareModalSettingsContentType(oldType: (...args: any[]) => any, thisContext: any, functionArguments: any) {
    const { hideDefaultSettings } = Settings.plugins[PluginInfo.PLUGIN_NAME];
    const oldTypeResult = Reflect.apply(oldType, thisContext, functionArguments);

    if (hideDefaultSettings)
        oldTypeResult.props.children = oldTypeResult.props.children.filter(c => !c?.props?.selectedFPS);
    oldTypeResult.props.children.push(<ReplacedStreamSettings />);

    return oldTypeResult;
}

export function getQuality() {
    const { framerate, height } = Settings.plugins[PluginInfo.PLUGIN_NAME].stores.ScreenshareStore.currentProfile;
    return { framerate, height };
}

export function replacedScreenshareModalComponent(oldComponent: (...args: any[]) => any, thisContext: any, functionArguments: any) {
    const oldComponentResult = Reflect.apply(oldComponent, thisContext, functionArguments);

    const content = oldComponentResult.props.children.props.children[2].props.children[1].props.children[3].props.children.props.children;
    const oldContentType = content.type;

    content.type = function () {
        return replacedScreenshareModalSettingsContentType(oldContentType, this, arguments);
    };

    const [submitBtn, cancelBtn] = oldComponentResult.props.children.props.children[2].props.children[2].props.children;

    submitBtn.props.onClick = () => {
        const { screensharePatcher, screenshareAudioPatcher } = Plugin;

        if (screensharePatcher) {
            screensharePatcher.forceUpdateTransportationOptions();
            if (screensharePatcher.connection?.connectionState === "CONNECTED")
                screensharePatcher.forceUpdateDesktopSourceOptions();
        }

        if (screenshareAudioPatcher)
            screenshareAudioPatcher.forceUpdateTransportationOptions();
    };
    return oldComponentResult;
}
