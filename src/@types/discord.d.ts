import type { ICommand } from "../bot/command";
import type { HoiLauncherManager, HoiSavesManager } from "../hoimanager";
import type { ConfigurationManager } from "../configuration";

declare module "discord.js" {
  interface Client {
    commands: ICommand[];
    hoiSavesManager?: HoiSavesManager;
    hoiLauncherManager?: HoiLauncherManager;
    configuration: ConfigurationManager;
  }
}
