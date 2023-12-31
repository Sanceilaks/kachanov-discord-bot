import {
	Client as DiscordClient,
	GatewayIntentBits,
	Events,
	Partials,
} from "discord.js";
import fs from "fs";
import path from "path";
import { HoiLauncherManager, HoiSavesManager, getCountryNameByTag } from "../hoimanager";
import { ICommand } from "./command";
import { ConfigurationManager } from "../configuration";
import { DatabaseAdapter } from "../database";

export default class BotClient extends DiscordClient {
	configuration: ConfigurationManager;
	commands: ICommand[] = [];
	hoiSavesManager?: HoiSavesManager;
	hoiLauncherManager?: HoiLauncherManager;
	database: DatabaseAdapter;

	constructor(configuraton: ConfigurationManager, database: DatabaseAdapter) {
		super({
			intents: [
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.DirectMessages
			],
			partials: [Partials.Channel, Partials.Message]
		});

		this.configuration = configuraton;
		this.database = database;

		this.hoiSavesManager = new HoiSavesManager("test.hoi4");
		this.hoiLauncherManager = new HoiLauncherManager();
	}

	private async loadCommands() {
		const commandsPath = path.join(__dirname, "commands");
		for (const entry of fs.readdirSync(commandsPath)) {
			if (!(entry.endsWith(".ts") || entry.endsWith(".js"))) continue;

			const filePath = path.join(commandsPath, entry);
			const command = require(filePath).default;
			this.commands.push(new command());
		}
	}

	private async setupListeners() {
		this.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			const commandsData = await Promise.all(
				this.commands.map((cmd) => cmd.getData!()),
			);
			const command = this.commands.filter(
				(_v, index) => commandsData[index].name == interaction.commandName,
			)[0];

			if (!command) return;

			command.execute!(interaction).catch((error) => {
				console.error(error);
				interaction
					.reply({
						content: "There was an error while executing this command!",
						ephemeral: true,
					})
					.catch(() => {
						interaction
							.editReply({
								content: "There was an error while executing this command!",
							})
							.catch((c) => {
								console.error(
									`Cannot reply to interaction on error due to ${c}`,
								);
							});
					});
			});
		});

		this.once(Events.ClientReady, async (cli) => {
			console.log(`Logged in as ${cli.user.tag}`);
			this.application?.commands.set(
				await Promise.all(this.commands.map((cmd) => cmd.getData!())),
			);
		});
	}

	public async start() {
		await this.hoiSavesManager!.initialize();
		await this.hoiLauncherManager!.initialize();

		console.log("Initializing countries");
		for (const c of await this.hoiSavesManager?.getAvilCountries()!) {
			try {
				await this.database.insertCountry(c, (await getCountryNameByTag(c, this.hoiSavesManager!))!);
			} catch (e) {
				console.error(e);
			}
		}

		await this.loadCommands();
		await this.setupListeners();

		await this.hoiSavesManager?.getAvilCountries();

		this.login(process.env[this.configuration.get<string>("tokenEnvPath")!]);
	}
}
