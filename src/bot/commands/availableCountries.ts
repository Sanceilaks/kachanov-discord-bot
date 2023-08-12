import {
	Interaction,
	SlashCommandBuilder,
	MessageComponentBuilder,
	EmbedBuilder,
	Colors,
} from "discord.js";
import { ICommand } from "../command";
import { getCountryNameByTag } from "../../hoimanager";
import { application } from "express";

export default class AvailableCountries implements ICommand {
	getData = async () => {
		return new SlashCommandBuilder()
			.setName("available_countries")
			.setDescription("Получить список доступных стран")
			.toJSON();
	};

	execute = async (interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) return;
		await interaction.deferReply({ ephemeral: true });
		
		const countriesList = await Promise.all((await interaction.client.database.getAvailableCountries())!.filter(async (country) => {
                const localisationName = (await interaction.client.database.countries?.findOne({ countryTag: country.countryTag }))!.countryName;
                return localisationName != undefined && localisationName != "undefined";
        }));


        const countries = (await Promise.all(countriesList.map(async (country) => {
				const localisationName = (await interaction.client.database.countries?.findOne({ countryTag: country.countryTag }))!.countryName;
                return localisationName != undefined && localisationName != "undefined" ? `${country.countryTag} - ${localisationName}` : '';
        }))).filter((country) => country != '');


		const embed = new EmbedBuilder()
			.setTitle("Доступные страны")
			.setDescription(countries.join("\n")!,)
			.setColor(Colors.LuminousVividPink);

		await interaction.editReply({
			embeds: [embed],
		});
	};
}
