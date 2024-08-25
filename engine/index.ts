import { ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";
export const storage: { [key: string]: any } = {};

export function Command(cooldown: number, guilds: string[], builder: any) {
	return function (target: any) {
		storage[`command_${target.name}`] = { cooldown, guilds, builder };
	};
}

export function Event(name: string, once: boolean = false) {
	return function (target: any) {
		storage[`event_${target.name}`] = { name, once };
	};
}

type componentTypes = "modal" | "button" | "select" | "text-input";
export type Automatic<T extends componentTypes> = T extends "select"
	? StringSelectMenuInteraction
	: T extends "button"
	? ButtonInteraction
	: T extends "modal"
	? ModalSubmitInteraction
	: T extends "text-input"
	? ModalSubmitInteraction
	: never;

export function Component(id: string, type: componentTypes) {
	return function (target: any) {
		storage[`component_${target.name}`] = { id, type, target };
	};
}
