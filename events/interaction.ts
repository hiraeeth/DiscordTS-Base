import { Events, Client, Interaction } from "discord.js";
import color from "@utils/colors";
import logger from "@utils/logger";

export default {
	name: Events.InteractionCreate,
	callback: async function (client: Client, interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return;

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
	},
};
