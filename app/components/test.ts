import { Client } from "discord.js";
import { Component, Automatic } from "engine";

@Component("my_select_menu", "select")
export default class MySelectMenuComponent {
	public static async callback(client: Client, interaction: Automatic<"select">) {
		const selectedValue = interaction.values[0];
		await interaction.reply(`You selected ${selectedValue}!`);
	}
}
