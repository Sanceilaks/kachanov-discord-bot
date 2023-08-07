import { Client, GatewayIntentBits, Events, Partials, SlashCommandBuilder } from "discord.js";
import { ICommand } from "./command";
import path from "path";
import fs from "fs";


export default class BotClient {
    envTokenName: string;
    discordClient: Client;
    commands: ICommand[] = [];

    constructor(envTokenName: string) {
        this.envTokenName = envTokenName;
        this.discordClient = new Client({
            intents: [
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.Guilds
            ],
            partials: [
                Partials.Channel,
                Partials.Message
            ]
        });
    }

    private async loadCommands(): Promise<void> {
        const commandsPath = path.join(__dirname, "commands");
        for (const entry of fs.readdirSync(commandsPath)) {
            if (!(entry.endsWith(".ts") || entry.endsWith(".js"))) continue;
            console.log(entry);

            const filePath = path.join(commandsPath, entry);
            const command = require(filePath).default;
            this.commands.push(new command);
        }
    }

    private async setupListeners(): Promise<void> {
        this.discordClient.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.commands.find(cmd => cmd.data!.name === interaction.commandName);
            if (!command) return;

            command.execute!(interaction).catch(error => {
                console.error(error);
                interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
            });

        });

        this.discordClient.once(Events.ClientReady, () => {
            console.log("Ready!");
            this.discordClient.application?.commands.set(this.commands.map(cmd => cmd.data!));
        });
    }

    public async start(): Promise<void> {
        await this.loadCommands();
        await this.setupListeners();

        this.discordClient.login(process.env[this.envTokenName]);
    }
};