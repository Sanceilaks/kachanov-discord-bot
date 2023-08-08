import {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Interaction,
} from "discord.js";

type CommandExecuteFn = (interaction: Interaction) => Promise<void>;

export interface ICommand {
  data?: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute?: CommandExecuteFn;
}
