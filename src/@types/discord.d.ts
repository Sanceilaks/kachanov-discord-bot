import type { ICommand } from "../bot/command";
import type { HoiLauncherManager, HoiSavesManager } from "../hoimanager";
import type { ConfigurationManager } from "../configuration";
import { DatabaseAdapter } from "../database";

declare module "discord.js" {
	interface Client {
		commands: ICommand[];
		hoiSavesManager?: HoiSavesManager;
		hoiLauncherManager?: HoiLauncherManager;
		configuration: ConfigurationManager;
		database: DatabaseAdapter;
	}
}
