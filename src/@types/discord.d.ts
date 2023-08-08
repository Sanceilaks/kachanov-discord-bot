import type { ICommand } from "../bot/command";
import type { HoiSavesManager } from "../hoimanager";
import type { ConfigurationManager } from "../configuration";

declare module "discord.js" {
  interface Client {
    commands: ICommand[];
    hoiManager: HoiSavesManager;
    configuration: ConfigurationManager;
  }
}
