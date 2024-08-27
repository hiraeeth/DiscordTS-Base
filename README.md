<h1 align="center">Discord v14 with TypeScript<br />
<div align="center">
<a href="https://github.com/hiraeeth/DiscordTS-Base/"><img src="https://i.imgur.com/ofhzYUH.png" title="Logo" style="max-width:100%;" width="128" /></a>
</div>
</h1>

## Documentation

You can find the entire documentation [here](https://docs.dragos.cc/discordts-base-v2/quickstart)

## Usage 📃 ‣
* Edit ```.env.example``` with your unique data.
* Install modules wtih ```npm install```
* Use one of the available commands:
```
npm run dev
npm run start
npm run build
```

## Templates 🐱‍💻 ‣
* ### Command
```ts
import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");
export const cooldown = 5;
export const options = {
	command: {
		guild: ["*"],
	},
};

export const callback = async (client: Client, interaction: CommandInteraction) => {
	await interaction.reply("Pong!");
};
```
* ### Event
```ts
import { Events, Client } from "discord.js";
import color from "@utils/colors";

export default {
	name: Events.ClientReady,
	once: true,
	callback: async function (client: Client, event: any) {
		console.log(`${color.fg.cyan}App ${color.reset}‣ ${color.fg.cyan}${event.user.username}${color.reset} is online.`);
	},
};
```
* ### Route
```ts
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
```
## Extensions ➕ ‣
* ### colors.ts (@utils/colors)
```ts
import color from "@utils/colors"
console.log(`${color.fg.red}Hello in red ${color.reset}.`);
```
* ### logger.ts (@utils/logger)
```ts
import logger from "@utils/logger"
logger.log("...")
logger.warn("...")
logger.debug("...")
logger.error("...")
```
