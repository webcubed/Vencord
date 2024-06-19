import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore } from "@webpack/common";
import { UserSettingsActionCreators } from "@webpack/common";

function generateSearchResults(query)
{
    let frequentChannelsWithQuery = Object.entries(UserSettingsActionCreators.FrecencyUserSettingsActionCreators.getCurrentValue().guildAndChannelFrecency.guildAndChannels)
    .map(([key, value]) => key)
    .filter((id) => ChannelStore.getChannel(id) != null)
    .filter((id) => ChannelStore.getChannel(id).name.includes(query))
    .sort((id1, id2) => {
        const channel1 = UserSettingsActionCreators.FrecencyUserSettingsActionCreators.getCurrentValue().guildAndChannelFrecency.guildAndChannels[id1];
        const channel2 = UserSettingsActionCreators.FrecencyUserSettingsActionCreators.getCurrentValue().guildAndChannelFrecency.guildAndChannels[id2];
        return channel2.totalUses - channel1.totalUses;
    })
    .slice(0, 20);

    return frequentChannelsWithQuery.map(channelID => 
    {
        let channel = ChannelStore.getChannel(channelID);
        return (
            {
                "type": "TEXT_CHANNEL",
                "record": channel,
                "score": 20,
                "comparator": query,
                "sortable": query
            }
        )
    })
}

export default definePlugin({
    name: "FrequentQuickSwitcher",
    description: "Rewrites and filters the quick switcher results to be your most frequent channels",
    authors:
    [
        Devs.Samwich
    ],
    generateSearchResults: generateSearchResults,
    patches: [
        {
            find: ".QUICKSWITCHER_PLACEHOLDER",
            replacement: {
                match: /let{selectedIndex:\i,results:\i}/,
                replace: "this.props.results = $self.generateSearchResults(this.state.query);$&"
            },
        }
    ]
});
