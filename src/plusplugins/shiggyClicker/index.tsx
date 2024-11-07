/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { Devs } from "@utils/constants";
import { ModalContent, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { Text, useState } from "@webpack/common";

import style from "./style.css";



export const settings = definePluginSettings({
    shiggies: {
        hidden: true,
        description: "",
        default: 0,
        type: OptionType.NUMBER,
    },
});

interface StoreSave {
    [key: string]: number;
}

const ShiggyClicker = ({ props }: { props: ModalProps; }) => {
    const [shiggies, setShiggies] = useState(settings.store.shiggies);

    const shiggyClick = () => {
        setShiggies(shiggies + 1);
        settings.store.shiggies = shiggies + 1;
    };


    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <Text variant="heading-lg/semibold">Shiggy Clicker</Text>
            </ModalHeader>

            <ModalContent className="shiggyClicker">
                <Text>{shiggies} shiggies!</Text>
                <img src="https://media.discordapp.net/stickers/1039992459209490513.png" alt="Shiggy" onClick={shiggyClick} />

                {/* <Button onClick={() => {
                    settings.store.shiggies = 0;
                    setShiggies(0);
                }}>Store</Button> */}
            </ModalContent>

        </ModalRoot>
    );
};
export default definePlugin({
    name: "[WIP] Shiggy Clicker",
    description: "A simple clicker game",
    authors: [Devs.ImLvna],

    settings,

    toolboxActions: {
        "Shiggy Clicker"() {
            openModal(props => <ShiggyClicker props={props} />);
        }
    },

    start() {
        enableStyle(style);
    },
    stop() {
        disableStyle(style);
    }
});
