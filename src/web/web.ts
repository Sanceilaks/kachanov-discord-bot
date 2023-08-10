import express, { Express, json } from "express";
import { DatabaseAdapter } from "../database";
import { Server as WsServer, WebSocket } from "ws";
import { ConfigurationManager } from "../configuration";
import BotClient from "../bot/client";
import { createServer, type Server } from "http";

const port = Number(process.env.PORT) || 1616;

export class WebUI {
	server: Server;
	app: Express;
	database: DatabaseAdapter;
	webSocket: WsServer;
	configuration: ConfigurationManager;
	discordClient: BotClient;

	constructor(
		database: DatabaseAdapter,
		configuration: ConfigurationManager,
		discordClient: BotClient,
	) {
		this.discordClient = discordClient;
		this.configuration = configuration;
		this.database = database;
		this.app = express();
		this.server = createServer(this.app);
		this.webSocket = new WsServer({ server: this.server, path: "/wss" });

		this.app.use(express.static("public"));
	}

	wsBroadcast = (action: string, data: any) =>
		this.webSocket.clients.forEach((client) =>
			client.send(JSON.stringify([action, data])),
		);

	async initialize() {
		this.webSocket.on("connection", async (ws: WebSocket) => {
			const wsSend = (action: string, data: any) =>
				ws.send(JSON.stringify([action, data]));

			wsSend("countries", await this.database.getAllCountries());
			wsSend("currentApplications", await this.database.getAllApplications());

			ws.on("message", async (message) => {
				const [action, data] = JSON.parse(message.toString());

				switch (action) {
					case "getUserInfo":
						wsSend("userInfo", await this.discordClient.users.fetch(data.id));
						break;

					case "countryBorrowed":
						await this.database.borrowCountry(data.countryTag, data.discordId);
						break;
					
					case "getCountry":
						wsSend("countryInfo", await this.database.getCountry(data.countryTag));
						break;
					case "startGame": {
						const countries = await this.database.getBorrowedCountries();
						if (countries!.length === 0)
							return;

						for (const country of countries!) {
							this.discordClient.users.fetch(country.borrowerDiscordId).then((user) => {
								user.send(`Тут будет ID и пароль. Спасибо за участие в тесте`).then(() => {
									console.log(`Sent message to ${country.borrowerDiscordId}`);
								});
							});
						}
						break;
					}
					case "reset": {
						//await this.database.applications?.clear();
						(await this.database.countries?.find({})!).forEach((country) => {
							this.database.countries?.update(country, {
								isBorrow: false,
								borrowerDiscordId: null,	
							})
						});
						break;
					}
				}
			});
		});

		this.database.on("countryBorrow", (countryTag: string) =>
			this.wsBroadcast("countryBorrow", { countryTag: countryTag }),
		);

		this.database.on("newApplication", (application: any) =>
			this.wsBroadcast("newApplication", application),
		);

		await this.startServer();
	}

	async startServer() {
		this.server.listen(port, "0.0.0.0", () => {
			console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
		});
	}
}
