import { Interaction, SlashCommandBuilder, PermissionFlagsBits  } from "discord.js";
import { ICommand } from "../command";

export default class MoveAllCommand implements ICommand {
  getData = async () => {
    return new SlashCommandBuilder()
      .setName("moveall")
      .setDescription("Move all users to another channel")
      .addChannelOption((option) =>
        option.setName("from").setDescription("From channel").setRequired(true),
      )
      .addChannelOption((option) =>
        option.setName("to").setDescription("To channel").setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
      .toJSON();
  };

  execute = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const fromChannel = await interaction.guild?.channels.fetch(
      interaction.options.getChannel("from")?.id!,
    );
    const toChannel = await interaction.guild?.channels.fetch(
      interaction.options.getChannel("to")?.id!,
    );

    if (!fromChannel?.isVoiceBased() || !toChannel?.isVoiceBased()) {
      interaction.reply({
        content: "Channel must be voice channels",
        ephemeral: true,
      });
      return;
    }

    for (const [_name, user] of fromChannel.members) {
      user.voice.setChannel(toChannel);
    }

    interaction.reply({
      content: "Done",
      ephemeral: true,
    });
  };
}
