import {
	Interaction,
	SlashCommandBuilder,
	MessageComponentBuilder,
	EmbedBuilder,
	Colors,
	PermissionFlagsBits,
} from "discord.js";
import { ICommand } from "../command";
import { getCountryNameByTag } from "../../hoimanager";
import { application } from "express";

export default class ForceBorrow implements ICommand {
	getData = async () => {
		return new SlashCommandBuilder()
			.setName("force_borrow")
			.setDescription("Зарегестрировать человека")
			.addStringOption((option) =>
				option
					.setName("country_tag")
					.setDescription(
						"Тег страны которую хотите занять. Для получения списка используйте /available_countries",
					)
					.setMaxLength(3)
					.setRequired(true),
			)
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("Пользователь")
					.setRequired(true),
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.toJSON();
	};

	execute = async (interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) return;
		await interaction.deferReply({ ephemeral: true });

		if (!interaction.client.configuration.get<string[]>("admins")?.includes(interaction.user.id)) {
			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setDescription("Недостаточно прав"),
				],
			});
			return;
		}

		const countryTag = interaction.options.getString("country_tag")!;
		const user = interaction.options.getUser("user")!;

		interaction.client.database.borrowCountry(countryTag, user.id).then(() => {
			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Green)
						.setDescription(`${user.displayName} занял ${countryTag}`),
				],
			});
		}).catch(e => {
			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setDescription(`Не удалось занять ${countryTag} из-за<br>${e}`),
				],
			});
		});
	};
}
