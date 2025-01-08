import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { mapMangledModuleLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";
import { FluxEvents } from "@webpack/types";

const Effects: { Dispatcher: { dispatch(eventName: string, args: any): void; }; } = mapMangledModuleLazy("this.emitter.setMaxListeners", {
    Dispatcher: e => "_savedDispatches" in e
});

const shake = async (duration: number, intensity: number) => !emergencyStopValue && Effects.Dispatcher.dispatch("SHAKE_APP", { duration, intensity: intensity * settings.store.multiplier });

function shakeOthers(event: any) {
    if (event.type in flux) return;
    if (settings.store.everything) shake(100, 1);
}

let emergencyStopValue = false;

function emergencyStop(e: KeyboardEvent) {
    if (e.key === "F9" && e.ctrlKey && e.altKey && e.shiftKey) {
        emergencyStopValue = !emergencyStopValue;
        if (emergencyStopValue) openPluginModal(Vencord.Plugins.plugins.Earthquake, () => { });
    }
}

const flux: Record<string, () => void> = {
    MESSAGE_CREATE: () => shake(500, 5),
    MESSAGE_UPDATE: () => shake(250, 3),
    TYPING_START: () => shake(150, 5),
    TYPING_STOP: () => shake(150, 3),
    MESSAGE_REACTION_ADD: () => shake(750, 3),
    MESSAGE_REACTION_ADD_MANY: () => shake(750, 4),
    MESSAGE_REACTION_REMOVE: () => shake(750, 4),
    MESSAGE_REACTION_REMOVE_EMOJI: () => shake(1000, 4),
    MESSAGE_REACTION_REMOVE_ALL: () => shake(1000, 4),
    PRESENCE_UPDATES: () => shake(150, 2),
    GUILD_MEMBER_LIST_UPDATE: () => shake(150, 2),
    TRACK: () => shake(150, 2),
    SPEAKING: () => shake(350, 4),
    DRAFT_CHANGE: () => shake(200, 2),
};

const settings = definePluginSettings({
    everything: {
        type: OptionType.BOOLEAN,
        description: "Shake on every flux event",
        default: false
    },
    multiplier: {
        type: OptionType.SLIDER,
        description: "Intensity multiplier",
        markers: (() => { let range = makeRange(0, 10, 0.5); range[0] = 0.1; return range; })(),
        default: 1,
        stickToMarkers: false,
    },
    whenUnfocused: {
        type: OptionType.BOOLEAN,
        description: "Shake when the app is unfocused",
        default: true,
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "Earthquake",
    description: "Make your Discord client shake",
    authors: [Devs.Sqaaakoi],

    settings,
    flux,

    start() {
        document.addEventListener("keydown", emergencyStop);
        (FluxDispatcher as any).addInterceptor(shakeOthers);
    },

    stop() {
        document.removeEventListener("keydown", emergencyStop);
        let i;
        while ((i = ((FluxDispatcher as any)._interceptors).indexOf(shakeOthers)) > -1) {
            ((FluxDispatcher as any)._interceptors).splice(i, 1);
        }
    },

    patches: [
        {
            find: "Shakeable is shaken when not mounted",
            predicate: () => settings.store.whenUnfocused,
            replacement: {
                match: /\i\.\i\.isFocused\(\)/,
                replace: "true"
            }
        }
    ]
});
