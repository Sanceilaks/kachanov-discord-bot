import {
	Interaction,
	SlashCommandBuilder,
	MessageComponentBuilder,
	EmbedBuilder,
	Colors,
} from "discord.js";
import { ICommand } from "../command";
import { getCountryNameByTag } from "../../hoimanager";

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
                const localisationName = await getCountryNameByTag(country.countryTag, interaction.client.hoiSavesManager!);
                return localisationName != "undefined";
        }));

        const countries = await Promise.all(countriesList.map(async (country) => {
                const localisationName = await getCountryNameByTag(country.countryTag, interaction.client.hoiSavesManager!);
                return `${country.countryTag} - ${localisationName}`;
        }));

		const embed = new EmbedBuilder()
			.setTitle("Доступные страны")
			.setDescription(countries.join("\n")!,)
			.setColor(Colors.LuminousVividPink);

		await interaction.editReply({
			embeds: [embed],
		});
	};
}
