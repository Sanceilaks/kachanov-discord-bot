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
      .setDescription("Получить все модификации из сейва")
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

    await interaction.deferReply({
      ephemeral:
        cfgForServer == null ||
        !cfgForServer.channelsWithoutEphemeral!.includes(
          interaction.channelId!,
        ),
    });

    const mods = await interaction.client.hoiManager.getMods();
    interaction.editReply({
      content: mods
        .map(
          (mod) =>
            (interaction.options.getString("format") == "openurl"
              ? "<steam://openurl/"
              : "<") +
            `https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.remoteFileId!}> - ${
              mod.name
            }`,
        )
        .join("\n"),
    });
  };
}
