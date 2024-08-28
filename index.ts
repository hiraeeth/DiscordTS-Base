import "dotenv/config";
import { Client, REST, Routes, SlashCommandBuilder, Collection, Interaction } from "discord.js";
import express, { Response, Request, Application } from "express";
import fs from "fs";
import path from "path";
import { addAliases } from "module-alias";
import { storage, Component } from "engine";

addAliases({
	"@/*": `${__dirname}/*`,
	"@utils": `${__dirname}/utils`,
});

const recursiveRead = (dir: string): string[] => {
	let results: string[] = [];
	const list = fs.readdirSync(dir);

	for (const file of list) {
		const pth = path.join(dir, file);
		const stat = fs.statSync(pth);

		if (stat && stat.isDirectory()) {
			results = results.concat(recursiveRead(pth));
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

const { TOKEN, CLIENT_ID } = process.env;
if (!TOKEN || !CLIENT_ID) {
	console.error(`${color.fg.red}⨯${color.reset} ${color.fg.red}TOKEN${color.reset} or ${color.fg.red}CLIENT_ID${color.reset} not found.`);
	console.error(`${color.fg.red}⨯${color.reset} Please make sure you have a ${color.fg.red}.env${color.reset} file with TOKEN and CLIENT_ID.`);
	process.exit(1);
}

export type CommandOptions = {
	command: {
		guild: string[];
	};
};

export type CallbackOptions = {
	cooldown: number;
	data: SlashCommandBuilder;
	used: Date;
	options: CommandOptions;
};

export type Command = {
	data: SlashCommandBuilder;
	callback: (client: Client, interaction: any, options: CallbackOptions) => Promise<void>;
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
client.components = new Collection();
client.globals = new Collection();

import { ServerOptions } from "server";

class RouteLoader {
	private app: Application = express();
	private methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

	async init(port: number) {
		if (!ServerOptions.enabled) {
			return;
		}

		try {
			this.app.listen(port, () => {
				const url = (ServerOptions.url || "http://127.0.0.1/").replace(/\/$/, "");
				console.log(`${color.fg.cyan}App ${color.reset}‣ Application started ➔  ${color.fg.cyan}${url}:${port}${color.reset}.`);
			});
		} catch (e) {
			console.error(`${color.fg.red}App ${color.reset}‣ Failed to start server: ${e}`);
			logger.error(`Failed to start server: ${e}`);
		}
	}

	async load(directory: string) {
		if (!ServerOptions.enabled) {
			return;
		}

		if (!ServerOptions.port) {
			console.error(`${color.fg.red}App ${color.reset}‣ ServerOptions.port is not defined`);
			return;
		}

		await this.init(Number(ServerOptions.port) || 3000);
		const dir = path.join(__dirname, directory);
		const files = await recursiveRead(dir);

		for (const file of files) {
			const module = require(file);
			const filePath = path.relative(dir, file).replace(/\.ts$/, "");
			const routePath = `/${filePath.replace(/\\/g, "/")}`;

			const methods = Object.keys(module).filter((key) => this.methods.includes(key) && typeof module[key] === "function");
			for (const method of methods) {
				const callback = module[method];
				const lowerCaseMethod = method.toLowerCase();

				try {
					this.app[lowerCaseMethod as keyof Application](routePath, async (req, res) => {
						await callback(client, req, res);
					});

					client.routes.set(routePath, module);
				} catch (e) {
					console.error(`${color.fg.red}App ${color.reset}‣ Route ${routePath} callback returned an error: ${e}`);
					logger.error(`Route ${routePath} callback returned an error: ${e}`);
				}
			}
		}

		if (client.routes.size > 0) {
			console.log(`${color.fg.cyan}App ${color.reset}‣ Loaded ${color.fg.cyan}${client.routes.size}${color.reset} ${client.routes.size > 1 ? "routes" : "route"}.`);
		}

		this.app.all("*", (req: Request, res: Response) => {
			res.status(404).json({ code: "route_not_found", message: "The requested route could not be found. Trying again won't solve the problem." });
		});
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
				const commandClass = require(filePath).default;
				const globals = require(filePath).globals;

				if (commandClass && commandClass.callback) {
					const metadata = storage[`command_${commandClass.name}`];
					if (metadata) {
						const { builder, cooldown, guilds } = metadata;
						client.commands.set(builder.name, {
							data: builder,
							callback: commandClass.callback,
							cooldown,
							used: new Date(0),
							options: { command: { guild: guilds } },
						});

						client.globals.set(builder.name, globals);
					} else {
						const formatted = path.relative(process.cwd(), filePath);
						console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ Command metadata not found. ${color.reset}`);
					}
				} else {
					const formatted = path.relative(process.cwd(), filePath);
					console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ File is missing ${color.fg.red}callback${color.reset} static property. ${color.reset}`);
				}
			}
		}
	}
}

class EventLoader {
	async load(directory: string) {
		const dir = path.join(__dirname, directory);
		const files = fs.readdirSync(dir).filter((file) => file.endsWith(".ts"));

		for (const file of files) {
			const filePath = path.join(dir, file);
			const eventClass = require(filePath).default;

			if (eventClass && eventClass.callback) {
				const metadata = storage[`event_${eventClass.name}`];
				if (metadata) {
					const { name, once } = metadata;
					client.events.set(name, { name, once, callback: eventClass.callback });

					if (once) {
						client.once(name, (...args) => eventClass.callback(client, ...args));
					} else {
						client.on(name, (...args) => eventClass.callback(client, ...args));
					}
				} else {
					const formatted = path.relative(process.cwd(), filePath);
					console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ Event metadata not found. ${color.reset}`);
				}
			} else {
				const formatted = path.relative(process.cwd(), filePath);
				console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ File is missing ${color.fg.red}callback${color.reset} static property. ${color.reset}`);
			}
		}

		if (client.events.size > 0) {
			console.log(`${color.fg.cyan}App ${color.reset}‣ Loaded ${color.fg.cyan}${client.events.size}${color.reset} ${client.events.size > 1 ? "events" : "event"}.`);
		}
	}
}

class ComponentLoader {
	async load(directory: string) {
		const dir = path.join(__dirname, directory);
		const files = fs.readdirSync(dir).filter((file) => file.endsWith(".ts"));

		for (const file of files) {
			const filePath = path.join(dir, file);
			const componentClass = require(filePath).default;

			if (componentClass && componentClass.callback) {
				const metadata = storage[`component_${componentClass.name}`];
				if (metadata) {
					const { type, id } = metadata;
					client.components.set(`${type}_${id}`, componentClass);
				} else {
					const formatted = path.relative(process.cwd(), filePath);
					console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ Component metadata not found. ${color.reset}`);
				}
			} else {
				const formatted = path.relative(process.cwd(), filePath);
				console.error(`${color.fg.red}⨯${color.reset} [${color.fg.red}${formatted}${color.reset}] ‣ File is missing ${color.fg.red}callback${color.reset} static property. ${color.reset}`);
			}
		}

		if (client.components.size > 0) {
			console.log(`${color.fg.cyan}App ${color.reset}‣ Loaded ${color.fg.cyan}${client.components.size}${color.reset} ${client.components.size > 1 ? "components" : "component"}.`);
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

		const startTime = new Date();
		await new CommandLoader().load("./app/commands");
		await new EventLoader().load("./app/events");
		await new RouteLoader().load("./app/routes");
		await new ComponentLoader().load("./app/components");

		console.log(`${color.fg.cyan}App ${color.reset}‣ Started refreshing ${color.fg.cyan}${client.commands.size}${color.reset} application (/) ${client.commands.size > 1 ? "commands" : "command"}.`);
		const commandMap: { [key: string]: SlashCommandBuilder[] } = {};

		for (const [_, command] of client.commands) {
			for (const guild of command.options.command.guild as string[]) {
				if (!commandMap[guild]) {
					commandMap[guild] = [];
				}
				commandMap[guild].push(command.data);
			}
		}

		for (const guild in commandMap) {
			if (guild === "*") {
				await rest.put(Routes.applicationCommands(String(CLIENT_ID)), { body: commandMap[guild] });
			} else {
				await rest.put(Routes.applicationGuildCommands(String(CLIENT_ID), String(guild)), { body: commandMap[guild] });
			}
		}

		const endTime = new Date();
		const time = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);

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
		components: Collection<string, any>;
		globals: Collection<string, any>;
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
