import "dotenv/config";
import { Client, REST, Routes, SlashCommandBuilder } from "discord.js";
import express, { Response, Request, Application } from "express";

import fs from "fs";
import path from "path";

import { addAliases } from "module-alias";
addAliases({
	"@utils": `${__dirname}/utils`,
});

const recursive_read = (dir: string): string[] => {
	let results: string[] = [];
	const list = fs.readdirSync(dir);

	for (const file of list) {
		const pth = path.join(dir, file);
		const stat = fs.statSync(pth);

		if (stat && stat.isDirectory()) {
			results = results.concat(recursive_read(pth));
		} else if (file.endsWith(".ts")) {
			results.push(pth);
		}
	}

	return results;
};

import color from "@utils/colors";
import logger from "@utils/logger";
const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
});

const { TOKEN, CLIENT_ID } = process.env;
export type CommandOptions = {
	command: {
		guild: string[];
	};
};
export type Command = {
	data: SlashCommandBuilder;
	callback: (client: Client, interaction: any) => Promise<void>;
	cooldown: number;
	used: Date;
	options: CommandOptions;
};
export type Event = {
	name: string;
	once: boolean;
	callback: (client: Client, ...args: any) => Promise<void>;
};
export type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type Route = {
	path: string;
	method: Methods | Methods[];
	callback: (client: Client, req: Request, res: Response) => Promise<void>;
};

export const commands: Command[] = [];
export const events: Event[] = [];
export const routes: Route[] = [];

const { USE_WEB_SERVER, BASE_URL, BASE_PORT } = process.env;
class RouteLoader {
	private app: Application = express();
	async init(port: number) {
		try {
			if (String(USE_WEB_SERVER).toLowerCase() === "yes" ? true : false) {
				this.app.listen(port, () => {
					console.log(`${color.fg.cyan}App ${color.reset}‣ Application started ➔  ${color.fg.cyan}${BASE_URL}:${port}/${color.reset}.`);
				});
			}
		} catch (e) {
			console.error(`${color.fg.red}App ${color.reset}‣ Failed to start server: ${e}`);
			logger.error(`Failed to start server: ${e}`);
		}
	}
	async load(directory: string) {
		if (String(USE_WEB_SERVER).toLowerCase() === "yes" ? true : false) {
			await this.init(Number(BASE_PORT) || 3000);

			const dir = path.join(__dirname, directory);
			const files = recursive_read(dir);

			for (const file of files) {
				const { default: route } = require(file);
				const { path: route_path, method, callback } = route;
				try {
					if (Array.isArray(method)) {
						for (const mthd of method) {
							this.app[String(mthd).toLowerCase()](route_path, async (req, res) => {
								await callback(client, req, res);
							});
						}
					} else {
						this.app[String(method).toLowerCase()](route_path, async (req, res) => {
							await callback(client, req, res);
						});
					}
				} catch (e) {
					console.error(`${color.fg.red}App ${color.reset}‣ Route ${route_path} callback returned an error: ${e}`);
					logger.error(`Route ${route_path} callback returned an error: ${e}`);
				}
			}

			this.app.all("*", (req: Request, res: Response) => {
				res.status(404).json({ code: "route_not_found", message: "The requested route could not be found. Trying again won't solve the problem." });
			});
		}
	}
}

class CommandLoader {
	async load(directory: string) {
		const dir = path.join(__dirname, directory);
		const folders = fs.readdirSync(dir);

		for (const folder of folders) {
			const command_path = path.join(dir, folder);
			const files = fs.readdirSync(command_path).filter((file) => file.endsWith(".ts"));

			for (const file of files) {
				const file_path = path.join(command_path, file);
				const { data, callback, cooldown, options } = require(file_path);

				if (data && callback) {
					commands.push({ data, callback, cooldown: cooldown || undefined, used: new Date(), options: options || { command: { guild: ["*"] } } });
				} else {
					const formatted = path.relative(process.cwd(), file_path);
					console.error(
						`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ File is missing ${color.fg.red}data${color.reset} or ${color.fg.red}callback${color.reset} exports. ${color.reset}`
					);
				}
			}
		}
	}
}

class EventLoader {
	async load(directory: string) {
		const dir = path.join(__dirname, directory);
		const files = recursive_read(dir);

		for (const file of files) {
			const { default: event } = require(file);
			const { name, once, callback } = event;

			events.push({
				name,
				once,
				callback,
			});

			if (event.once) {
				client.once(name, (...args) => callback(client, ...args));
			} else {
				client.on(name, (...args) => callback(client, ...args));
			}
		}

		if (events.length > 0) {
			console.log(`${color.fg.cyan}App ${color.reset}‣ Loaded ${color.fg.cyan}${events.length}${color.reset} ${events.length > 1 ? "events" : "event"}.`);
		}
	}
}

const rest = new REST({ version: "10" }).setToken(String(TOKEN));
(async () => {
	try {
		const start_time = new Date();
		await new CommandLoader().load("./commands");
		await new EventLoader().load("./events");
		await new RouteLoader().load("./routes");

		console.log(`${color.fg.cyan}App ${color.reset}‣ Started refreshing ${color.fg.cyan}${commands.length}${color.reset} application (/) ${commands.length > 1 ? "commands" : "command"}.`);
		const map: { [key: string]: SlashCommandBuilder[] }[] = [];

		for (const command of commands) {
			for (const guild of command.options.command.guild as string[]) {
				if (!map[guild]) {
					map[guild] = [];
				}
				map[guild].push(command.data);
			}
		}

		for (const guild in map) {
			if (guild === "*") {
				await rest.put(Routes.applicationCommands(String(CLIENT_ID)), { body: map[guild] });
			} else {
				await rest.put(Routes.applicationGuildCommands(String(CLIENT_ID), String(guild)), { body: map[guild] });
			}
		}

		const end_time = new Date();
		const time = ((end_time.getTime() - start_time.getTime()) / 1000).toFixed(2);

		console.log(
			`${color.fg.cyan}App ${color.reset}‣ [${color.fg.cyan}${time}s${color.reset}] Successfully reloaded ${color.fg.cyan}${commands.length}${color.reset} application (/) ${
				commands.length > 1 ? "commands" : "command"
			}.`
		);
	} catch (e) {
		logger.error(`${e}`);
		console.error(`${color.fg.red}⨯${color.reset} ${e}.`);
	}
})();

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	for (const command of commands) {
		if (interaction.commandName === command.data.name) {
			const current_time = new Date().getTime();
			try {
				if (command.cooldown) {
					if (command.used.getTime() + command.cooldown * 1000 <= current_time) {
						await command.callback(client, interaction);
						command.used = new Date();
					} else {
						await interaction.reply({ content: `Command is on a cooldown and cannot be used yet.`, ephemeral: true });
					}
				} else {
					await command.callback(client, interaction);
					command.used = new Date();
				}
			} catch (e) {
				console.error(`${color.fg.red}⨯${color.reset} Command [${color.fg.red}${command.data.name}${color.reset}] callback returned an error: ${e}.`);
				logger.error(`Command ${command.data.name} callback returned an error: ${e}`);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: "Command callback failed to be executed.", ephemeral: true });
				} else {
					await interaction.reply({ content: "Command callback failed to be executed.", ephemeral: true });
				}
			}
		}
	}
});

try {
	client.login(TOKEN);
} catch (e) {
	console.error(`${color.fg.red}⨯${color.reset} ${e}.`);
	logger.error(`BOT failed to start: ${e}`);
}
