import { Client, Events } from "discord.js";
import { Event } from "engine";

import color from "@utils/colors";

@Event(Events.ClientReady, true)
export default class ReadyEvent {
	public static async callback(client: Client, event: any) {
		console.log(`${color.fg.cyan}App ${color.reset}‣ ${color.fg.cyan}${event.user.username}${color.reset} is online.`);
	}
}
