import type { ICommand } from "../command";
import type { HoiSavesManager } from "../hoisavesmanager";

declare module "discord.js" {
    interface Client {
        commands: ICommand[];
        hoiManager: HoiSavesManager;
    }
}