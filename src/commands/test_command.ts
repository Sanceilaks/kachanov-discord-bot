import { ICommand } from "../command";
import { Interaction, SlashCommandBuilder } from "discord.js";

export default class TestCommand implements ICommand {
    data = new SlashCommandBuilder().setName("test").setDescription("test");
    
    execute = async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;
        interaction.reply({ content: "test", ephemeral: true });
    };
}