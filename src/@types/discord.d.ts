import type { ICommand } from "../command";
import type { HoiSavesManager } from "../hoisavesmanager";
import type { ConfigurationManager } from "../configuration";

declare module "discord.js" {
  interface Client {
    commands: ICommand[];
    hoiManager: HoiSavesManager;
    configuration: ConfigurationManager;
  }
}
