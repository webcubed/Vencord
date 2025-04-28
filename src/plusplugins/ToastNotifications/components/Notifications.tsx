/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React, ReactDOM } from "@webpack/common";
import type { JSX, ReactNode } from "react";
import type { Root } from "react-dom/client";

import { settings as PluginSettings } from "../index";
import NotificationComponent from "./NotificationComponent";

let NotificationQueue: JSX.Element[] = [];
let notificationID = 0;
let RootContainer: Root;

/**
 * getNotificationContainer()
 * Gets the root container for the notifications, creating it if it doesn't exist.
 * @returns {Root} The root DOM container.
 */
function getNotificationContainer() {
    if (!RootContainer) {
        const container = document.createElement("div");
        container.id = "toastnotifications-container";
        document.body.append(container);
        RootContainer = ReactDOM.createRoot(container);
    }

    return RootContainer;
}

export interface NotificationData {
    title: string; // Title to display in the notification.
    body: string; // Notification body text.
    richBody?: ReactNode; // Same as body, though a rich ReactNode to be rendered within the notification.
    icon?: string; // Avatar image of the message author or source.
    image?: string; // Large image to display in the notification for attachments.
    permanent?: boolean; // Whether or not the notification should be permanent or timeout.
    dismissOnClick?: boolean; // Whether or not the notification should be dismissed when clicked.
    attachments: number;
    onClick?(): void;
    onClose?(): void;
}

export async function showNotification(notification: NotificationData) {
    const root = getNotificationContainer();
    const thisNotificationID = notificationID++;

    return new Promise<void>(resolve => {
        const ToastNotification = (
            <NotificationComponent
                key={thisNotificationID.toString()}
                index={NotificationQueue.length}
                {...notification}
                onClose={() => {
                    // Remove this notification from the queue.
                    NotificationQueue = NotificationQueue.filter(n => n.key !== thisNotificationID.toString());
                    notification.onClose?.(); // Trigger the onClose callback if it exists.
                    console.log(`[DEBUG] [ToastNotifications] Removed #${thisNotificationID} from queue.`);

                    // Re-render remaining notifications with new reversed indices.
                    root.render(
                        <>
                            {NotificationQueue.map((notification, index) => {
                                const reversedIndex = (NotificationQueue.length - 1) - index;
                                return React.cloneElement(notification, { index: reversedIndex });
                            })}
                        </>
                    );

                    resolve();
                }}
            />
        );

        // Add this notification to the queue.
        NotificationQueue.push(ToastNotification);
        console.log(`[DEBUG] [ToastNotifications] Added #${thisNotificationID} to queue.`);

        // Limit the number of notifications to the configured maximum.
        if (NotificationQueue.length > PluginSettings.store.maxNotifications) NotificationQueue.shift();

        // Render the notifications.
        root.render(
            <>
                {NotificationQueue.map((notification, index) => {
                    const reversedIndex = (NotificationQueue.length - 1) - index;
                    return React.cloneElement(notification, { index: reversedIndex });
                })}
            </>
        );
    });
}
