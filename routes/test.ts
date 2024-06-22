import { Client } from "discord.js";
import { Request, Response } from "express";

const { GUILD_ID } = process.env;

export default {
	path: "/api/test",
	method: "GET",
	callback: async function (client: Client, req: Request, res: Response) {
		const guild = await client.guilds.fetch(String(GUILD_ID));
		const channel = await guild.channels.fetch(String("1253847724894457996"));

		if (channel && channel.isTextBased()) {
			await channel.send("Hello!");
			console.log(`Message sent to channel ${channel.name}`);
		} else {
			console.log("The specified channel is not a text channel.");
		}

		return res.json({
			message: `Message sent to channel: ${channel ? channel.name : "unknown"}`,
		});
	},
};
