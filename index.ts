import "dotenv/config";
import { Client, REST, Routes, SlashCommandBuilder, Collection } from "discord.js";
import express, { Response, Request, Application } from "express";

import fs from "fs";
import path from "path";

import { addAliases } from "module-alias";
addAliases({
	"@/*": `${__dirname}/*`,
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

const color = (() => {
	try {
		return require("@utils/colors").default;
	} catch (e) {
		console.error("Colors module not found. You can download it here: https://github.com/hiraeeth/DiscordTS-Base ");
		process.exit(1);
	}
})();

const logger = (() => {
	try {
		return require("@utils/logger").default;
	} catch (e) {
		console.error("Logger module not found. You can download it here: https://github.com/hiraeeth/DiscordTS-Base ");
		process.exit(1);
	}
})();

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
});

const config = new (require("@utils/config").default)().load;

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

client.commands = new Collection();
client.events = new Collection();
client.routes = new Collection();

class RouteLoader {
	private app: Application = express();
	async init(port: number) {
		if (config.web_server && config.web_server.url && config.web_server.port) {
			try {
				this.app.listen(port, () => {
					const url = config.web_server.url.replace(/\/$/, "");
					console.log(`${color.fg.cyan}App ${color.reset}‣ Application started ➔  ${color.fg.cyan}${url}:${port}${color.reset}.`);
				});
			} catch (e) {
				console.error(`${color.fg.red}App ${color.reset}‣ Failed to start server: ${e}`);
				logger.error(`Failed to start server: ${e}`);
			}
		}
	}
	async load(directory: string) {
		if (config.web_server && config.web_server.url && config.web_server.port) {
			await this.init(Number(config.web_server.port) || 3000);

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
					client.routes.set(route_path, route);
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
			const commandPath = path.join(dir, folder);
			const files = fs.readdirSync(commandPath).filter((file) => file.endsWith(".ts"));

			for (const file of files) {
				const filePath = path.join(commandPath, file);
				const { data, callback, cooldown, options } = require(filePath);

				if (data && callback) {
					client.commands.set(data.name, { data, callback, cooldown: cooldown || 0, used: new Date(0), options: options || { command: { guild: ["*"] } } });
				} else {
					const formatted = path.relative(process.cwd(), filePath);
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

			client.events.set(name, { name, once, callback });

			if (once) {
				client.once(name, (...args) => callback(client, ...args));
			} else {
				client.on(name, (...args) => callback(client, ...args));
			}
		}

		if (client.events.size > 0) {
			console.log(`${color.fg.cyan}App ${color.reset}‣ Loaded ${color.fg.cyan}${client.events.size}${color.reset} ${client.events.size > 1 ? "events" : "event"}.`);
		}
	}
}

let rest: REST | undefined = undefined;
try {
	rest = new REST({ version: "10" }).setToken(String(TOKEN));
} catch (e) {
	rest = undefined;
	console.error(`${color.fg.red}⨯${color.reset} ${e}.`);
	logger.error(`REST client failed to start: ${e}`);
}

(async () => {
	try {
		if (rest == undefined) {
			throw new Error("Failed to start the REST client.");
		}

		const start_time = new Date();
		await new CommandLoader().load("./commands");
		await new EventLoader().load("./events");
		await new RouteLoader().load("./routes");

		console.log(`${color.fg.cyan}App ${color.reset}‣ Started refreshing ${color.fg.cyan}${client.commands.size}${color.reset} application (/) ${client.commands.size > 1 ? "commands" : "command"}.`);
		const map: { [key: string]: SlashCommandBuilder[] } = {};

		for (const [_, command] of client.commands) {
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
			`${color.fg.cyan}App ${color.reset}‣ [${color.fg.cyan}${time}s${color.reset}] Successfully reloaded ${color.fg.cyan}${client.commands.size}${color.reset} application (/) ${
				client.commands.size > 1 ? "commands" : "command"
			}.`
		);
	} catch (e) {
		logger.error(`${e}`);
		console.error(`${color.fg.red}⨯${color.reset} ${e}.`);
	}
})();

try {
	client.login(TOKEN);
} catch (e) {
	console.error(`${color.fg.red}⨯${color.reset} ${e}.`);
	logger.error(`Login failed: ${e}`);
}

declare module "discord.js" {
	interface Client {
		commands: Collection<string, Command>;
		events: Collection<string, Event>;
		routes: Collection<string, Route>;
	}
}

process.on("uncaughtException", (err) => {
	console.error(`${color.fg.red}⨯${color.reset} ${color.fg.red}Uncaught Exception${color.reset} ‣ ${err} ${color.reset}`);
	logger.error(`Uncaught Exception: ${err}`);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error(`${color.fg.red}⨯${color.reset} ${color.fg.red}Unhandled Rejection${color.reset} ‣ ${reason} ${color.reset}`);
	logger.error(`Unhandled Rejection: ${reason} at ${promise}`);
});

client.on("error", (err) => {
	console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}DISCORD${color.reset}] ‣ ${err} ${color.reset}`);
	logger.error(`Discord error: ${err}`);
});
