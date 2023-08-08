import {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Interaction,
} from "discord.js";

type CommandExecuteFn = (interaction: Interaction) => Promise<void>;
type GetDataFn = () => Promise<RESTPostAPIChatInputApplicationCommandsJSONBody>;

export interface ICommand {
  getData?: GetDataFn;
  execute?: CommandExecuteFn;
}
