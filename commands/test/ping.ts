import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");
export const cooldown = 5;
export const options = {
	command: {
		guild: ["*"],
	},
};

import cfg from "@utils/config";
const config = new cfg().load;

export const callback = async (client: Client, interaction: CommandInteraction) => {
	await interaction.reply("Pong!");
};
