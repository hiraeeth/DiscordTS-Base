import { Events, Client, Interaction } from "discord.js";
import { Event } from "engine";

import color from "@utils/colors";
import logger from "@utils/logger";

@Event(Events.InteractionCreate)
export default class InteractionCreateEvent {
	public static async callback(client: Client, interaction: Interaction) {
		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return;

			const current_time = new Date().getTime();
			try {
				if (command.cooldown && command.cooldown > 0) {
					if (command.used.getTime() + command.cooldown * 1000 <= current_time) {
						await command.callback(client, interaction);
						command.used = new Date();
					} else {
						await interaction.reply({ content: "Command is on a cooldown and cannot be used yet.", ephemeral: true });
					}
				} else {
					await command.callback(client, interaction);
					command.used = new Date();
				}
			} catch (e) {
				console.error(`${color.fg.red}⨯${color.reset} Command [${color.fg.red}${command.data.name}${color.reset}] callback returned an error: ${e}.`);
				logger.error(`Command ${command.data.name} callback returned an error: ${e}`);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: "Command failed to be executed.", ephemeral: true });
				} else {
					await interaction.reply({ content: "Command failed to be executed.", ephemeral: true });
				}
			}
		} else if (interaction.isModalSubmit()) {
			const modalComponent = client.components.get("modal_" + interaction.customId);
			if (modalComponent) {
				try {
					await modalComponent.callback(client, interaction);
				} catch (e) {
					console.error(`${color.fg.red}⨯${color.reset} Modal [${color.fg.red}${interaction.customId}${color.reset}] callback returned an error: ${e}.`);
					logger.error(`Modal ${interaction.customId} callback returned an error: ${e}`);
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: "Modal submission failed to be processed.", ephemeral: true });
					} else {
						await interaction.reply({ content: "Modal submission failed to be processed.", ephemeral: true });
					}
				}
			}
		} else if (interaction.isButton()) {
			const buttonComponent = client.components.get("button_" + interaction.customId);
			if (buttonComponent) {
				try {
					await buttonComponent.callback(client, interaction);
				} catch (e) {
					console.error(`${color.fg.red}⨯${color.reset} Button [${color.fg.red}${interaction.customId}${color.reset}] callback returned an error: ${e}.`);
					logger.error(`Button ${interaction.customId} callback returned an error: ${e}`);
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: "Button click failed to be processed.", ephemeral: true });
					} else {
						await interaction.reply({ content: "Button click failed to be processed.", ephemeral: true });
					}
				}
			}
		} else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || interaction.isRoleSelectMenu() || interaction.isMentionableSelectMenu() || interaction.isChannelSelectMenu()) {
			const selectComponent = client.components.get("select_" + interaction.customId);
			if (selectComponent) {
				try {
					await selectComponent.callback(client, interaction);
				} catch (e) {
					console.error(`${color.fg.red}⨯${color.reset} Select Menu [${color.fg.red}${interaction.customId}${color.reset}] callback returned an error: ${e}.`);
					logger.error(`Select Menu ${interaction.customId} callback returned an error: ${e}`);
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: "Select menu selection failed to be processed.", ephemeral: true });
					} else {
						await interaction.reply({ content: "Select menu selection failed to be processed.", ephemeral: true });
					}
				}
			}
		}
	}
}
