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
