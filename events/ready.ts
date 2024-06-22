import { Events, Client } from "discord.js";
import color from "@utils/colors";

export default {
	name: Events.ClientReady,
	once: true,
	callback: async function (client: Client, event: any) {
		console.log(`${color.fg.cyan}App ${color.reset}‣ ${color.fg.cyan}${event.user.username}${color.reset} is online.`);
	},
};
