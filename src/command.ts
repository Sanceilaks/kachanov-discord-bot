import { SlashCommandBuilder, Interaction } from "discord.js";

type CommandExecuteFn = (interaction: Interaction) => Promise<void>;

export interface ICommand {
    data?: SlashCommandBuilder;
    execute?: CommandExecuteFn;
}