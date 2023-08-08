import {
  Client as DiscordClient,
  GatewayIntentBits,
  Events,
  Partials,
} from "discord.js";
import fs from "fs";
import path from "path";
import { HoiSavesManager } from "./hoisavesmanager";
import { ICommand } from "./command";
import { ConfigurationManager } from "./configuration";

export default class BotClient extends DiscordClient {
  configuration: ConfigurationManager;
  commands: ICommand[] = [];
  hoiManager: HoiSavesManager;

  constructor(configuraton: ConfigurationManager) {
    super({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.configuration = configuraton;

    this.hoiManager = new HoiSavesManager("test.hoi4");
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, "commands");
    for (const entry of fs.readdirSync(commandsPath)) {
      if (!(entry.endsWith(".ts") || entry.endsWith(".js"))) continue;

      const filePath = path.join(commandsPath, entry);
      const command = require(filePath).default;
      this.commands.push(new command());
    }
  }

  private async setupListeners(): Promise<void> {
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.find(
        (cmd) => cmd.data!.name === interaction.commandName,
      );
      if (!command) return;

      command.execute!(interaction).catch((error) => {
        console.error(error);
        interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      });
    });

    this.once(Events.ClientReady, () => {
      console.log("Ready!");
      this.application?.commands.set(
        this.commands.map((cmd) => cmd.data!),
      );
    });
  }

  public async start(): Promise<void> {
    await this.hoiManager.initialize();
    await this.loadCommands();
    await this.setupListeners();

    this.login(process.env[this.configuration.get("tokenEnvPath")!]);
  }
}
