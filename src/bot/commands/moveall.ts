import {
	Interaction,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} from "discord.js";
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
		await interaction.deferReply({ ephemeral: true });

		await interaction.guild?.fetch();

		const fromChannel = await interaction.guild?.channels.fetch(
			interaction.options.getChannel("from")?.id!,
		);
		const toChannel = await interaction.guild?.channels.fetch(
			interaction.options.getChannel("to")?.id!,
		);

		if (
			(!fromChannel?.isVoiceBased() &&
				fromChannel?.type != ChannelType.GuildCategory) ||
			!toChannel?.isVoiceBased()
		) {
			interaction.editReply({
				content: "Channel must be voice channels",
			});
			return;
		}

		if (fromChannel?.type == ChannelType.GuildCategory) {
			for (const [name, channel] of fromChannel.children.cache.filter(
				(c) => c.isVoiceBased() && c.id != fromChannel.id,
			)) {
				for (const [_name, user] of channel.members) {
					user.voice.setChannel(toChannel).catch((с) => {
						console.error(
							`Failed to move ${user.nickname} to ${toChannel.name} due to ${с}`,
						);
					});
				}
			}
		} else {
			for (const [_name, user] of fromChannel.members) {
				user.voice.setChannel(toChannel).catch((с) => {
					console.error(
						`Failed to move ${user.nickname} to ${toChannel.name} due to ${с}`,
					);
				});
			}
		}

		interaction.editReply({
			content: "Done",
		});
	};
}
