/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";


export default definePlugin({
    name: "FakeSoundboard",
    description: "Allows you to use soundboard without nitro! (Vesktop/Web only)",
    authors: [Devs.ImLvna],

    patches: [
        {
            find: "SOUNDBOARD_PLAY_SOUND.format",
            replacement: [{
                match: /(?<=premiumDisabled,)(\i)&&!(\i)(?=\))/,
                replace: "false"
            }, {
                match: /(?<=onContextMenu:)\i&&!\i\?(\i):void 0/,
                replace: "$1"
            }]
        },
        {
            find: "canUseCustomCallSounds:function",
            replacement: {
                match: /(?<=canUseCustomCallSounds:function\(\i\){return )\i\(\i,\i\)(?=\})/,
                replace: "true"
            }
        },
        {
            find: "SOUNDBOARD_PLAY_SOUND.format",
            replacement: {
                match: /null==\i\?\i\|\|(\i\(\i\)):\i\(\)/,
                replace: "$1"
            }
        },
        {
            find: ".showVoiceChannelCoachmark",
            replacement: {
                match: /(?<=\i\.\i\))\(\i,(\i),__OVERLAY__,\i\)/,
                replace: ";$self.playSound(`https://cdn.discordapp.com/soundboard-sounds/${$1.soundId}`)"
            }
        },
        {
            // Pass microphone stream to RNNoise
            find: "window.webkitAudioContext",
            replacement: {
                match: /(?<=\i\.acquire=function\((\i)\)\{return )navigator\.mediaDevices\.getUserMedia\(\1\)(?=\})/,
                replace: "$&.then(stream => $self.connectSoundboard(stream, $1.audio))"
            },
        },
        {
            find: "window.webkitAudioContext",
            replacement: {
                match: /(?<=connectRnnoise\(stream, (\i)\.audio\)\))(?=\})/,
                replace: "$&.then(stream => $self.connectSoundboard(stream, $1.audio))"
            },
        }
    ],

    audioDestination: null as null | MediaStreamAudioDestinationNode,
    audioCtx: null as null | AudioContext,

    async playSound(url: string) {
        if (!this.audioCtx || !this.audioDestination) return;
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(buffer);
        const source = this.audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioDestination!);
        source.start(0, 0, 20); // 20 seconds max
    },
    async connectSoundboard(stream: MediaStream, isAudio: boolean): Promise<MediaStream> {
        if (!isAudio) return stream;
        console.log("connectSoundboard", stream);

        this.audioCtx = new AudioContext();

        const source = this.audioCtx.createMediaStreamSource(stream);


        this.audioDestination = this.audioCtx.createMediaStreamDestination();
        source.connect(this.audioDestination);

        const _audioCtx = this.audioCtx;

        // Cleanup
        const onEnded = () => {
            source.disconnect();
            _audioCtx.close();
        };
        stream.addEventListener("inactive", onEnded, { once: true });

        return this.audioDestination.stream;
    },
});
