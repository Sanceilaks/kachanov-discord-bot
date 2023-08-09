import {
  Interaction,
  SlashCommandBuilder,
  MessageComponentBuilder,
} from "discord.js";
import { ICommand } from "../command";

export default class GetMods implements ICommand {
  getData = async () => {
    return new SlashCommandBuilder()
      .setName("take_the_country")
      .setDescription("Подать заявку на занятие страны")
      .addStringOption((option) =>
        option
          .setName("country_tag")
          .setDescription(
            "Тег страны которую хотите занять. Для получения списка используйте /available_countries",
          )
          .setMaxLength(3)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Причина занятия")
          .setRequired(true),
      )
      .toJSON();
  };

  execute = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ ephemeral: true });

    const countryTag = interaction.options
      .getString("country_tag")!
      .toUpperCase();
    const reason = interaction.options.getString("reason")!;

    await interaction.client.database
      .requestBorrowCountry(countryTag, interaction.user.id, reason)
      .then(async (result) => {
        await interaction.editReply({
          content: `Заявка на занятие страны ${countryTag} отправлена на модерацию`,
        });
      })
      .catch(async (error) => {
        await interaction.editReply({
          content: `Заявка на занятие страны ${countryTag} не отправлена на модерацию. ${error}`,
        });
      });
  };
}
