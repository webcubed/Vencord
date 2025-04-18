import definePlugin from "@utils/types";
import { moment } from "@webpack/common";
import { findByProps } from "@webpack";
import { React } from "@webpack/common";
import { User } from "discord-types/general";

interface PresenceStatus {
    hasBeenOnline: boolean;
    lastOffline: number | null;
}

const recentlyOnlineList: Map<string, PresenceStatus> = new Map();

function handlePresenceUpdate(status: string, userId: string) {
    if (recentlyOnlineList.has(userId)) {
        const presenceStatus = recentlyOnlineList.get(userId)!;
        if (status !== "offline") {
            presenceStatus.hasBeenOnline = true;
            presenceStatus.lastOffline = null;
        } else if (presenceStatus.hasBeenOnline && presenceStatus.lastOffline == null) {
            presenceStatus.lastOffline = Date.now();
        }
    } else {
        recentlyOnlineList.set(userId, {
            hasBeenOnline: status !== "offline",
            lastOffline: status === "offline" ? Date.now() : null
        });
    }
}

function formatTime(time: number) {
    const diff = moment.duration(moment().diff(time));
    const d = Math.floor(diff.asDays());
    const h = Math.floor(diff.asHours());
    const m = Math.floor(diff.asMinutes());

    if (d > 0) return `${d}d`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return "1m";
}

export default definePlugin({
    name: "LastOnline",
    description: "Adds a last online indicator under usernames in your DM list and guild and GDM member list",
    authors: [
        {
            id: 644298972420374528n,
            name: "Nick"
        }
    ],
    flux: {
        PRESENCE_UPDATES({ updates }) {
            updates.forEach(update => {
                handlePresenceUpdate(update.status, update.user.id);
            });
        }
    },
    patches: [
        // Patches the guild member list
        {
            find: ".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)",
            replacement: {
                match: /(.OFFLINE;return null==(\i).{0,1000}subText:)/,
                replace: "$1$self.shouldShowRecentlyOffline($2)?$self.buildRecentlyOffline($2):"
            }
        },

        // Patches the DM list
        {
            find: "PrivateChannel.renderAvatar",
            replacement: {
                match: /({id:(\i).id.{0,1000}subText:)/,
                replace: "$1$self.shouldShowRecentlyOffline($2.recipients.length === 1 ? { id: $2.recipients[0] } : null)?$self.buildRecentlyOffline({ id: $2.recipients[0] }):"
            }
        }
    ],
    shouldShowRecentlyOffline(user: User) {
        if (!user || !user.id) return false;

        const presenceStatus = recentlyOnlineList.get(user.id);
        return presenceStatus && presenceStatus.hasBeenOnline && presenceStatus.lastOffline !== null;
    },
    buildRecentlyOffline(user: User) {
        if (!user) return <></>;

        const subtext = findByProps("interactiveSelected", "interactiveSystemDM", "subtext").subtext;

        const presenceStatus = recentlyOnlineList.get(user.id);
        const formattedTime = presenceStatus && presenceStatus.lastOffline !== null
            ? formatTime(presenceStatus.lastOffline)
            : "";
        return (
            <div className={subtext}>
                <>Online <strong>{formattedTime} ago</strong></>
            </div>
        );
    }
});
