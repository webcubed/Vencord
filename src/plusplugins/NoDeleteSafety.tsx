import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Alerts, Button, GuildStore } from "@webpack/common";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
const DeleteGuild = findByPropsLazy("deleteGuild", "sendTransferOwnershipPincode").deleteGuild;

function GetPropsAndDeleteGuild(id)
{
    let GotGuild = GuildStore.getGuild(id);
    if(!GotGuild) return;
    
    DeleteGuild(id, GotGuild.name);
}

const settings = definePluginSettings(
{
    confirmModal: {
        type: OptionType.BOOLEAN,
        description: "Should a \"are you sure you want to delete\" modal be shown?",
        default: true
    },
});

export default definePlugin({
    name: "NoDeleteSafety",
    description: "Removes the \"enter server name\" requirement when deleting a server",
    authors:
    [
        Devs.Samwich
    ],
    settings,
    async HandleGuildDeleteModal(server)
    {
        if(settings.store.confirmModal)
        {
            Alerts.show({title: "Delete server?", body: <p>It's permanent, if that wasn't obvious.</p>, confirmColor: Button.Colors.RED, confirmText: "Delete", onConfirm: () => GetPropsAndDeleteGuild(server.id), cancelText: "Cancel"});
        }
        else
        {
            GetPropsAndDeleteGuild(server.id);
        }
    },
    patches: [
        {
            find: ".DELETE,onClick(){let",
            replacement: {
                match: /let \i=(\i).toString\(\)/,
                replace: "$self.HandleGuildDeleteModal($1);return;$&"
            }
        }
    ]
});
