import { addContextMenuPatch, findGroupChildrenByChildId, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, Menu, Switch, Text, UploadHandler, useEffect, useState, Select } from "@webpack/common";
import { Message } from "discord-types/general";
import { QuoteIcon } from "./components";
import { wrapText, canvasToBlob, FixUpQuote, fetchImageAsBlob} from "./utils";

enum ImageStyle
{
    inspirational
}

const messagePatch: NavContextMenuPatchCallback = (children, { message }) => {
    recentmessage = message;
    if (!message.content) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(
        group.findIndex(c => c?.props?.id === "copy-text") + 1, 0,
        <Menu.MenuItem
            id="vc-quote"
            label="Quote"
            icon={QuoteIcon}
            action={async () => {
                openModal(props => <QuoteModal {...props} />);
            }}
        />
    );
};

let recentmessage: Message;
let grayscale;
let setStyle : ImageStyle = ImageStyle.inspirational;

export default definePlugin({
    name: "Quoter",
    description: "Adds the ability to create an inspirational quote image from a message",
    authors: [Devs.Samwich],
    contextMenus: {
        "message": messagePatch
    }
});

function sizeUpgrade(url) {
    const u = new URL(url);
    u.searchParams.set("size", "512");
    return u.toString();
}

let preparingSentence: string[] = [];
const lines: string[] = [];

async function createQuoteImage(avatarUrl: string, name: string, quoteOld: string, grayScale: boolean): Promise<Blob> {
    const quote = FixUpQuote(quoteOld);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Cant get 2d rendering context :(");
    }

    switch(setStyle)
    {
        case ImageStyle.inspirational:

            const cardWidth = 1200;
            const cardHeight = 600;

            canvas.width = cardWidth;
            canvas.height = cardHeight;

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const avatarBlob = await fetchImageAsBlob(avatarUrl);
            const fadeBlob = await fetchImageAsBlob("https://files.catbox.moe/54e96l.png");

            const avatar = new Image();
            const fade = new Image();

            const avatarPromise = new Promise<void>(resolve => {
                avatar.onload = () => resolve();
                avatar.src = URL.createObjectURL(avatarBlob);
            });

            const fadePromise = new Promise<void>(resolve => {
                fade.onload = () => resolve();
                fade.src = URL.createObjectURL(fadeBlob);
            });

            await Promise.all([avatarPromise, fadePromise]);

            ctx.drawImage(avatar, 0, 0, cardHeight, cardHeight);

            if (grayScale)
            {
                ctx.globalCompositeOperation = "saturation";
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, cardWidth, cardHeight);
                ctx.globalCompositeOperation = "source-over";
            }

            ctx.drawImage(fade, cardHeight - 400, 0, 400, cardHeight);

            ctx.fillStyle = "#fff";
            ctx.font = "italic 20px Georgia";
            const quoteWidth = cardWidth / 2 - 50;
            const quoteX = ((cardWidth - cardHeight));
            const quoteY = cardHeight / 2 - 10;
            wrapText(ctx, `"${quote}"`, quoteX, quoteY, quoteWidth, 20, preparingSentence, lines);

            const wrappedTextHeight = lines.length * 25;

            ctx.font = "bold 16px Georgia";
            const authorNameX = (cardHeight * 1.5) - (ctx.measureText(`- ${name}`).width / 2) - 30;
            const authorNameY = quoteY + wrappedTextHeight + 30;

            ctx.fillText(`- ${name}`, authorNameX, authorNameY);
            preparingSentence.length = 0;
            lines.length = 0;
            return await canvasToBlob(canvas);
    }
}

function registerStyleChange(style)
{
    setStyle = style;
    GeneratePreview();
}

function QuoteModal(props: ModalProps) {
    const [gray, setGray] = useState(true);
    useEffect(() => {
        grayscale = gray;
        GeneratePreview();
    }, [gray]);
    return (
        <ModalRoot {...props} size={ModalSize.MEDIUM}>
            <ModalHeader separator={false}>
                <Text color="header-primary" variant="heading-lg/semibold" tag="h1" style={{ flexGrow: 1 }}>
                    Catch Them In 4K.
                </Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent scrollbarType="none">
                <img src={""} id={"quoterPreview"} style={{ borderRadius: "20px", width: "100%" }}></img>
                <br></br><br></br>
                <Switch value={gray} onChange={setGray}>Grayscale</Switch>
                <Select look={1} 
                    options={Object.keys(ImageStyle).filter(key => isNaN(parseInt(key, 10))).map(key => ({ label: key.charAt(0).toUpperCase() + key.slice(1), 
                    value: ImageStyle[key as keyof typeof ImageStyle] }))} 
                    select={v => registerStyleChange(v)} isSelected={v => v == setStyle} 
                    serialize={v => v}></Select>
                <br/>
                <Button color={Button.Colors.BRAND_NEW} size={Button.Sizes.SMALL} onClick={() => Export()} style={{ display: "inline-block", marginRight: "5px" }}>Export</Button>
                <Button color={Button.Colors.BRAND_NEW} size={Button.Sizes.SMALL} onClick={() => SendInChat(props.onClose)} style={{ display: "inline-block" }}>Send</Button>
            </ModalContent>
            <br></br>
        </ModalRoot>
    );
}

async function SendInChat(onClose) {
    const image = await createQuoteImage(sizeUpgrade(recentmessage.author.getAvatarURL()), recentmessage.author.username, recentmessage.content, grayscale);
    const preview = generateFileNamePreview(recentmessage.content);
    const imageName = `${preview} - ${recentmessage.author.username}`;
    const file = new File([image], `${imageName}.png`, { type: "image/png" });
    UploadHandler.promptToUpload([file], getCurrentChannel(), 0);
    onClose();
}

async function Export() {
    const image = await createQuoteImage(sizeUpgrade(recentmessage.author.getAvatarURL()), recentmessage.author.username, recentmessage.content, grayscale);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(image);
    const preview = generateFileNamePreview(recentmessage.content);

    const imageName = `${preview} - ${recentmessage.author.username}`;
    link.download = `${imageName}.png`;
    link.click();
    link.remove();
}

async function GeneratePreview() {
    const image = await createQuoteImage(sizeUpgrade(recentmessage.author.getAvatarURL()), recentmessage.author.username, recentmessage.content, grayscale);
    document.getElementById("quoterPreview")?.setAttribute("src", URL.createObjectURL(image));
}

function generateFileNamePreview(message) {
    const words = message.split(" ");
    let preview;
    if (words.length >= 6) {
        preview = words.slice(0, 6).join(" ");
    } else {
        preview = words.slice(0, words.length).join(" ");
    }
    return preview;
}