import { Client, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Command, CommandOptions } from "engine";

export const globals = {
	some_variable: "test"
}

@Command(5, ["*"], new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"))
export default class PingCommand {
	public static async callback(client: Client, interaction: CommandInteraction, options: CommandOptions) {
		// get options
		const cooldown = options.cooldown; // is: 3
		const command_name = options.data.name; // is: ping

		// get current global variables
		const globals = client.globals.get(command_name);
		console.log(globals.some_variable); // is: test

		await interaction.reply("Pong!");
	}
}
