import express, { Express, json } from "express";
import { DatabaseAdapter } from "../database";
import { Server as WsServer, WebSocket } from "ws";
import { ConfigurationManager } from "../configuration";
import BotClient from "../bot/client";
import { createServer, type Server } from "http";

const port = Number(process.env.PORT) || 1717;

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
						this.database.borrowCountry(data.countryTag, data.discordId).then(() => {
							this.discordClient.users.fetch(data.discordId).then(async (user) => {
								const country = await this.database.countries?.findOne({ countryTag: data.countryTag })!;
								const name = country!.countryName;
								user.send(`Вы заняли ${name}`).then(() => {
									console.log(`Sent message to ${data.discordId}`);
								});
							});
						}).catch(() => {
							console.error(`Failed to borrow country ${data.countryTag}`);
						});
						
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
								user.send(`${country.countryName} ${data.content}`).then(() => {
									console.log(`Sent message to ${country.borrowerDiscordId}`);
								});
							});
						}
						break;
					}
					case "reset": {
						if (data.target === "applications")
							await this.database.applications?.clear();
						else if (data.target === "countries")
							await Promise.all((await this.database.countries?.find({})!).map((country) => {
								return this.database.countries?.update(country, {
									isBorrow: false,
									borrowerDiscordId: null,	
								})
							}));
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
