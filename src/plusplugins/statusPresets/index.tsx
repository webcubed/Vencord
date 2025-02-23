/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings, Settings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import ErrorBoundary from "@components/ErrorBoundary";
import { proxyLazy } from "@utils/lazy";
import { classes } from "@utils/misc";
import { openModalLazy } from "@utils/modal";
import { useForceUpdater } from "@utils/react";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import { extractAndLoadChunksLazy, findByPropsLazy, findComponentByCodeLazy, findModuleId, wreq } from "@webpack";
import { Button, Clickable, Menu, Toasts, UserStore, useState } from "@webpack/common";


const settings = definePluginSettings({
    StatusPresets: {
        type: OptionType.COMPONENT,
        description: "Status Presets",
        component: () => <></>,
        default: {}
    }
});

interface Emoji {
    animated: boolean;
    id: bigint | null;
    name: string;
}

const CircleXIcon = findComponentByCodeLazy("22Zm4.7-15.7a1");

interface DiscordStatus {
    emojiInfo: Emoji | null;
    text: string;
    clearAfter: "TODAY" | number | null;
    status: "online" | "dnd" | "idle" | "invisible";
}

const StatusStyles = findByPropsLazy("statusItem");
// TODO: find clearCustomStatusHint original css/svg or replace
const PMenu = findComponentByCodeLazy(".menuItemLabel", ".menuItemInner");
const EmojiComponent = findComponentByCodeLazy(/\.translateSurrogatesToInlineEmoji\(\i.\i\),/);

const CustomStatusSettings = getUserSettingLazy("status", "customStatus")!;
const StatusModule = proxyLazy(() => {
    const id = findModuleId("this.renderCustomStatusInput()");
    return wreq(Number(id));
});

const requireCustomStatusModal = extractAndLoadChunksLazy(["action:\"PRESS_ADD_CUSTOM_STATUS\"", /\i\.\i\i\)/]);

const openCustomStatusModalLazy = () => openModalLazy(async () => {
    await requireCustomStatusModal();
    const key = Object.keys(StatusModule)[0];
    const Component = StatusModule[key];
    return props => <Component {...props} />;
});

function getExpirationMs(expiration: "TODAY" | number) {
    if (expiration !== "TODAY") return Date.now() + expiration;

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

function setStatus(status: DiscordStatus) {
    CustomStatusSettings.updateSetting({
        text: status.text.trim(),
        expiresAtMs: status.clearAfter != null ? String(getExpirationMs(status.clearAfter)) : "0",
        emojiId: status.emojiInfo?.id ?? "0",
        emojiName: status.emojiInfo?.name ?? "",
        createdAtMs: String(Date.now())
    });
}

const ClearStatusButton = () => <Clickable className={StatusStyles.clearCustomStatusHint} onClick={e => { e.stopPropagation(); CustomStatusSettings?.updateSetting(null); }}><CircleXIcon /></Clickable>;

function StatusIcon({ isHovering, status }: { isHovering: boolean; status: DiscordStatus; }) {
    return <div className={StatusStyles.status}>{isHovering ?
        <CircleXIcon />
        : (status.emojiInfo != null ? <EmojiComponent emoji={status.emojiInfo} animate={false} hideTooltip={false} /> : <div className={StatusStyles.customEmojiPlaceholder} />)}</div>;
}

const RenderStatusMenuItem = ({ status, update, disabled }: { status: DiscordStatus; update: () => void; disabled: boolean; }) => {
    const [isHovering, setIsHovering] = useState(false);
    const handleMouseOver = () => {
        setIsHovering(true);
    };

    const handleMouseOut = () => {
        setIsHovering(false);
    };

    return <div className={classes(StatusStyles.statusItem, "vc-sp-item", disabled ? "vc-sp-disabled" : null)}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}>
        <Clickable
            onClick={e => {
                e.stopPropagation();
                settings.store.StatusPresets[status.text] = undefined; // setting to undefined to remove it.
                update();
            }}><StatusIcon isHovering={isHovering} status={status} /></Clickable>
        <div className={StatusStyles.status} style={{ marginLeft: "2px" }}>{status.text}</div>
    </div >;
};


const StatusSubMenuComponent = () => {
    let premiumType;
    if (Settings.plugins.NoNitroUpsell?.enabled) {
        // @ts-ignore
        premiumType = UserStore?.getCurrentUser()?._realPremiumType ?? UserStore?.getCurrentUser()?.premiumType ?? 0;
    } else {
        premiumType = UserStore?.getCurrentUser()?.premiumType ?? 0;
    }
    const update = useForceUpdater();
    return <Menu.Menu navId="sp-custom-status-submenu" onClose={() => { }}>
        {Object.entries((settings.store.StatusPresets as { [k: string]: DiscordStatus | undefined; })).map(([index, status]) => status != null ? <Menu.MenuItem
            key={"status-presets-" + index}
            id={"status-presets-" + index}
            label={status.status}
            action={() => (status.emojiInfo?.id != null && premiumType > 0 || status.emojiInfo?.id == null) && setStatus(status)}
            render={() => <RenderStatusMenuItem
                status={status}
                update={update}
                disabled={status.emojiInfo?.id != null && premiumType === 0}
            />}
        /> : null)}
    </Menu.Menu>;
};


export default definePlugin({
    name: "StatusPresets",
    description: "Allows you to save your statuses and easily set them later",
    authors: [
        {
            name: "i am me",
            id: 984392761929256980n,
        },
    ],
    settings: settings,
    dependencies: ["UserSettingsAPI"],
    patches: [
        {
            find: "#{intl::CUSTOM_STATUS_SET_CUSTOM_STATUS}",
            replacement: {
                match: /\.\i\i,children:\i\.\i\.string\(\i\.\i#{intl::SAVE}\)\}\)/,
                replace: "$&,$self.renderSaveButton(this.state)"
            }
        },
        {
            find: "#{intl::STATUS_MENU_LABEL}",
            replacement: {
                match: /:void 0\}\)/,
                replace: "$&,$self.render()"
            }
        }
    ],
    render() {
        const status = CustomStatusSettings.getSetting();
        return (
            <ErrorBoundary>
                <div className={StatusStyles.menuDivider} />
                {status == null ?
                    <PMenu
                        id="sp-custom/presets-status"
                        action="PRESS_SET_STATUS"
                        onClick={openCustomStatusModalLazy}
                        icon={
                            () => <div
                                className={StatusStyles.customEmojiPlaceholder}
                            />
                        }
                        label="Set Custom Status"
                        renderSubmenu={StatusSubMenuComponent}
                    />
                    :
                    <PMenu
                        id="sp-edit/presets-status"
                        action="PRESS_EDIT_CUSTOM_STATUS"
                        onClick={openCustomStatusModalLazy}
                        hint={<ClearStatusButton />}
                        icon={
                            () => status.emoji != null ? (
                                <EmojiComponent
                                    emoji={status.emoji}
                                    animate={false}
                                    hideTooltip={false}
                                />
                            ) : null
                        }
                        label="Edit Custom Status"
                        renderSubmenu={StatusSubMenuComponent}
                    />}
            </ErrorBoundary>
        );
    },
    renderSaveButton(statue: DiscordStatus) {
        return <Button
            look={Button.Looks.LINK}
            color={Button.Colors.WHITE}
            size={Button.Sizes.MEDIUM}
            onClick={e => {
                settings.store.StatusPresets[statue.text] = statue;
                Toasts.show({
                    message: "Successfully saved status!",
                    type: Toasts.Type.SUCCESS,
                    id: Toasts.genId()
                });
            }}
            style={{ marginRight: "20px" }}
        >Save</Button>;
    },
    startAt: StartAt.WebpackReady
});
