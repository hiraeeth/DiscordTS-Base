import { Client, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Command, CommandOptions } from "engine";

export const globals = {
	some_variable: "test",
};

@Command(5, ["*"], new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"))
export default class PingCommand {
	public static async callback(client: Client, interaction: CommandInteraction, options: CommandOptions) {
		if (!interaction.memberPermissions?.has(PermissionFlagsBits.SendMessages)) {
			await interaction.reply({ content: "You do not have the required permissions to use this command.", ephemeral: true });
			return;
		}

		console.log(options.data.name) // will log: ping
		console.log(options.cooldown) // will log: 5

		await interaction.reply("Pong!");
	}
}
