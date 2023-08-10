import {
	Interaction,
	SlashCommandBuilder,
	MessageComponentBuilder,
} from "discord.js";
import { ICommand } from "../command";

export default class GetMods implements ICommand {
	getData = async () => {
		return new SlashCommandBuilder()
			.setName("get_mods")
			.setDescription("Получить все модификации для игры")
			.addStringOption((option) =>
				option
					.setName("format")
					.setDescription("Формат ссылки")
					.setRequired(true)
					.addChoices({ name: "Стандартный", value: "std" })
					.addChoices({ name: "Open Url", value: "openurl" }),
			)
			.toJSON();
	};

	execute = async (interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) return;
		const cfgForServer =
			interaction.client.configuration.getConfigurationForServer(
				interaction.guildId!,
			);

		console.log(interaction.client.configuration.get<string[]>("admins")!);
		console.log(interaction.user.id);
		await interaction.deferReply({
			ephemeral:
				(cfgForServer == null ||
					!cfgForServer.channelsWithoutEphemeral!.includes(
						interaction.channelId!,
					)) &&
				!interaction.client.configuration
					.get<string[]>("admins")
					?.includes(interaction.user.id),
		});

		const mods = interaction.client.configuration.get<boolean>(
			"isModsFromLaunchConfig",
		)
			? await interaction.client.hoiLauncherManager!.getMods()
			: await interaction.client.hoiSavesManager!.getMods();

		interaction.editReply({
			content: mods
				.map(
					(mod) =>
						(interaction.options.getString("format") == "openurl"
							? "steam://openurl/<"
							: "<") +
						`https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.remoteFileId!}> - ${
							mod.name
						}`,
				)
				.join("\n"),
		});
	};
}
