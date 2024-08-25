import { Client } from "discord.js";
import { Request, Response } from "express";

export async function GET(client: Client, req: Request, res: Response) {
	const guild = await client.guilds.fetch(String("1103319264921915392"));
	const channel = await guild.channels.fetch(String("1260799306315731085"));

	if (channel && channel.isTextBased()) {
		await channel.send("get request!");
		console.log(`Message sent to channel ${channel.name}`);
	}
	return res.json({
		message: `Message sent to channel: ${channel ? channel.name : "unknown"}`,
	});
}

export async function POST(client: Client, req: Request, res: Response) {
	const guild = await client.guilds.fetch(String("1103319264921915392"));
	const channel = await guild.channels.fetch(String("1260799306315731085"));

	if (channel && channel.isTextBased()) {
		await channel.send("post request!");
		console.log(`Message sent to channel ${channel.name}`);
	} else {
		console.log("The specified channel is not a text channel.");
	}

	return res.json({
		message: `Message sent to channel: ${channel ? channel.name : "unknown"}`,
	});
}
