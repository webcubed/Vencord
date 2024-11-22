import definePlugin from "@utils/types";
import { Devs } from "@utils/constants";

export default definePlugin({
    name: "NoChannelEmoji",
    authors: [Devs.camila314],
    description: "Removes all emojis from channel names",
    patches: [
	    {
	    	find: "webGuildTextChannel",
	    	replacement: {
	    		match: /(let{channel:\i,guild:\i,disableSorting.+?=(\i))/,
	    		replace: "$2.channel = $self.modify($2.channel); $&"
	    	}
	    },
	    {
	        find: ".GUILD_CATEGORY?null:",
	        replacement: {
	            match: /(let \i,{channel:\i,.+?=(\i))/,
	            replace: "$2.channel = $self.modify($2.channel); $&"
	        }
	    }
    ],

    modify(channel) {
		channel.name = channel.name.replace(/<:.+?:\d+>/g, "");
		channel.name = channel.name.replace(/[^\p{L}\p{N}\p{P}\p{Z}{\^\$}]/gu, "");

		if (channel.name.startsWith("-")) channel.name = channel.name.slice(1);
		if (channel.name.endsWith("-")) channel.name = channel.name.slice(0, -1);

		if (channel.name.startsWith(" ")) channel.name = channel.name.slice(1);
		if (channel.name.endsWith(" ")) channel.name = channel.name.slice(0, -1);


		return channel;
    }
});
