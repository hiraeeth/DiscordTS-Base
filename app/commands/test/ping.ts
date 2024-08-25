import { Client, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "engine";

@Command(5, ["*"], new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"))
export default class PingCommand {
	public static async callback(client: Client, interaction: CommandInteraction) {
		if (!interaction.memberPermissions?.has(PermissionFlagsBits.SendMessages)) {
			await interaction.reply({ content: "You do not have the required permissions to use this command.", ephemeral: true });
			return;
		}

		await interaction.reply("Pong!");
	}
}
