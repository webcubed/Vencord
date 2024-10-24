/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import "./style.css";

import { addAccessory } from "@api/MessageAccessories";
import { addButton } from "@api/MessagePopover";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore } from "@webpack/common";

import { convert } from "./converter";
import { conversions, ConverterAccessory, ConvertIcon } from "./ConverterAccessory";


export const settings = definePluginSettings({
    myUnits: {
        type: OptionType.SELECT,
        description: "The units you use and want things to be converted to. (Defaults to imperial)",
        options: [
            {
                default: true,
                label: "Imperial",
                value: "imperial"
            },
            {
                label: "Metric",
                value: "metric"
            }
        ]
    }
    // invert: {
    //     type: OptionType.BOOLEAN,
    //     default: false,
    //     // is there a better way to word this?
    //     description: "If this option is set, ignore the units you set and invert every conversion."
    // }
});
export default definePlugin({
    name: "UnitConverter",
    description: "Converts metric units to imperial units and vice versa",
    authors: [
        {
            name: "sadan",
            id: 521819891141967883n
        }
    ],
    start(){
        addAccessory("vc-converter", props => <ConverterAccessory message={props.message}/>);
        addButton("vc-converter", message => {
            if (!message.content) return null;
            return {
                label: "Convert Units",
                icon: ConvertIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async() => {
                    const setConversion = conversions.get(message.id);
                    if (!setConversion) return;
                    setConversion(convert(message.content));
                }
            };
        });
    },
    settings
});
