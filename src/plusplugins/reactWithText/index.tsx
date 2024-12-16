import definePlugin from "@utils/types";
import { Button, Menu, Switch, Text, UploadHandler, useEffect, useState } from "@webpack/common";
import { addButton, removeButton } from "@api/MessagePopover";
import { ChannelStore } from "@webpack/common";
import { PropsWithChildren } from "react";
import { classes } from "@utils/misc";
import { Logger } from "@utils/Logger";
import { SVGProps } from "react";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { findByCode, findByCodeLazy } from "@webpack";

const logger = new Logger("TextReact");

interface BaseIconProps extends IconProps {
    viewBox: string;
}

interface IconProps extends SVGProps<SVGSVGElement> {
    className?: string;
    height?: string | number;
    width?: string | number;
}

function Icon({ height = 24, width = 24, className, children, viewBox, ...svgProps }: PropsWithChildren<BaseIconProps>) {
    return (
        <svg
            className={classes(className, "vc-icon")}
            role="img"
            width={width}
            height={height}
            viewBox={viewBox}
            {...svgProps}
        >
            {children}
        </svg>
    );
}

export function Husk(props: IconProps) {
    return (
        <Icon
            {...props}
            className={classes(props.className, "vc-husk")}
            viewBox="0 0 24 24"
        >
            <path xmlns="http://www.w3.org/2000/svg" d="M12.821 22.328c0 .703 0 1.785-1.311 1.785-.798 0-1.121-.436-1.311-1.158-.703.836-1.558 1.273-2.603 1.273-2.565 0-4.521-2.186-4.521-5.263 0-3.001 2.014-5.3 4.521-5.3 1.007 0 1.995.399 2.603 1.254.076-.665.646-1.14 1.311-1.14 1.311 0 1.311 1.083 1.311 1.786v6.763zm-4.844-.607c1.425 0 2.109-1.444 2.109-2.755s-.665-2.792-2.109-2.792c-1.501 0-2.166 1.482-2.166 2.792.001 1.31.684 2.755 2.166 2.755zm6.403-10.829c0-.912.57-1.52 1.368-1.52.798 0 1.368.608 1.368 1.52v3.723c.722-.627 1.652-.95 2.603-.95 2.944 0 4.407 2.754 4.407 5.415 0 2.584-1.747 5.148-4.503 5.148-.93 0-1.994-.418-2.507-1.254-.171.722-.608 1.139-1.368 1.139-.798 0-1.368-.607-1.368-1.52V10.892zm4.883 10.829c1.425 0 2.128-1.482 2.128-2.755 0-1.292-.703-2.792-2.128-2.792-1.463 0-2.146 1.368-2.146 2.697-.001 1.33.645 2.85 2.146 2.85zm12.824-5.016c-.684 0-1.292-.532-2.165-.532-1.559 0-2.299 1.387-2.299 2.792 0 1.349.817 2.755 2.299 2.755.684 0 1.709-.57 2.032-.57.647 0 1.178.551 1.178 1.197 0 1.405-2.355 1.881-3.344 1.881-2.944 0-4.901-2.413-4.901-5.263 0-2.773 2.015-5.3 4.901-5.3 1.083 0 3.344.399 3.344 1.729 0 .57-.399 1.311-1.045 1.311z" fill="#FFF"/>

        </Icon>
    );
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function convertToRegionalIndicators(text: string) {
    const regionalIndicators = new Map<string, string[]>([
        ["a", ["\uD83C\uDDE6", "\uD83C\uDD70"]],
        ["b", ["\uD83C\uDDE7", "\uD83C\uDD71"]],
        ["c", ["\uD83C\uDDE8", "©"]],
        ["d", ["\uD83C\uDDE9"]],
        ["e", ["\uD83C\uDDEA", "\uD83D\uDCE7"]],
        ["f", ["\uD83C\uDDEB"]],
        ["g", ["\uD83C\uDDEC"]],
        ["h", ["\uD83C\uDDED", "♓"]],
        ["i", ["\uD83C\uDDEE", "ℹ"]],
        ["j", ["\uD83C\uDDEF"]],
        ["k", ["\uD83C\uDDF0"]],
        ["l", ["\uD83C\uDDF1"]],
        ["m", ["\uD83C\uDDF2", "Ⓜ", "♏", "♍"]],
        ["n", ["\uD83C\uDDF3", "♑"]],
        ["o", ["\uD83C\uDDF4", "\uD83C\uDD7E", "⭕"]],
        ["p", ["\uD83C\uDDF5", "\uD83C\uDD7F"]],
        ["q", ["\uD83C\uDDF6"]],
        ["r", ["\uD83C\uDDF7", "®"]],
        ["s", ["\uD83C\uDDF8"]],
        ["t", ["\uD83C\uDDF9", "✝"]],
        ["u", ["\uD83C\uDDFA"]],
        ["v", ["\uD83C\uDDFB", "♈"]],
        ["w", ["\uD83C\uDDFC"]],
        ["x", ["\uD83C\uDDFD", "❎", "❌", "✖"]],
        ["y", ["\uD83C\uDDFE"]],
        ["z", ["\uD83C\uDDFF"]],
        ["0", ["0️⃣"]],
        ["1", ["1️⃣"]],
        ["2", ["2️⃣"]],
        ["3", ["3️⃣"]],
        ["4", ["4️⃣"]],
        ["5", ["5️⃣"]],
        ["6", ["6️⃣"]],
        ["7", ["7️⃣"]],
        ["8", ["8️⃣"]],
        ["9", ["9️⃣"]],
        ["?", ["❔", "❓"]],
        ["+", ["➕"]],
        ["-", ["➖", "⛔", "\uD83D\uDCDB"]],
        ["!", ["❕", "❗"]],
        ["*", ["*️⃣"]],
        ["$", ["\uD83D\uDCB2"]],
        ["#", ["#️⃣"]],
        [" ", ["▪", "◾", "➖", "◼", "⬛", "⚫", "\uD83D\uDDA4", "\uD83D\uDD76"]]
    ]);

    let result = '';
    let reactionIndexes = new Map<string, number>();

    for (const char of text.toLowerCase()) {
        const emojis = regionalIndicators.get(char);
        if (emojis) {
            const reactionIndex = reactionIndexes.get(char) || 0; // Get the current reaction index for the letter
            result += emojis[reactionIndex]; // Append the corresponding emoji
            reactionIndexes.set(char, (reactionIndex + 1) % emojis.length); // Update the reaction index for the next occurrence
        } else {
            result += char;
        }
        logger.log(`Character: ${char}, Converted: ${result}`);
    }

    return result;
}

    async function addReactionsWithDelay(channelId, messageId, reactions) {
        for (const reaction of reactions) {
            await sleep(1000); // Wait for 1 second before adding each reaction
            findByCodeLazy("#{intl::EMOJI_PICKER_DOUBLE_REACTION_SUPER_ERROR_TITLE}")(channelId, messageId, { name: reaction });
        }
    }


function OpenWindow(props: ModalProps & { message: any; onClose: () => void }) {
    const { message, onClose, ...modalProps } = props;

    const [inputText, setInputText] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(event.target.value);
    };

    const handleConfirm = async () => {
        const channel = ChannelStore.getChannel(message.channel_id);
        const regionalText = convertToRegionalIndicators(inputText);
        const reactionList = [...regionalText];
        await props.onClose();
        await addReactionsWithDelay(channel.id, message.id, reactionList);
        // await props.onClose();
    };


    return (
        <ModalRoot {...modalProps} size={ModalSize.MEDIUM}>
            <ModalHeader separator={false}>
                <Text color="header-primary" variant="heading-lg/semibold" tag="h1" style={{ flexGrow: 1 }}>
                    Input text to react with.
                    </Text>
                    {/* <br></br>
                    <Text color="red" variant="heading-lg/semibold" tag="p" style={{ flexGrow: 1 }}>
                    (If your text has any numbers or special characters, those will not be included in the reaction message and will cause you to be rate limited. (Don't spam them too much.))
                </Text> */}
                <ModalCloseButton onClick={onClose} />
            </ModalHeader>
            <ModalContent scrollbarType="none">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    style={{
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        fontSize: '16px',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'transparent',
                        color: '#ffffff',
                    }}
                />
                <Button onClick={handleConfirm}>Add Reactions</Button>
            </ModalContent>
        </ModalRoot>
    );
}



export default definePlugin({
    name: "React with Text",
    description: "Lets you react with text",
    authors: [{ name: "chaos_the_chaotic", id: 799267390827003916n }],
    dependencies: ["MessagePopoverAPI"],

    async start() {
        addButton("Husk", msg => {
            return {
                label: "Text React",
                icon: Husk,
                message: msg,
                channel: ChannelStore.getChannel(msg.channel_id),
                onClick: () => openModal(props => <OpenWindow {...props} message={msg} onClose={props.onClose} />)
            };
        });
    },

    stop() {
        removeButton("Husk");
    },
});
