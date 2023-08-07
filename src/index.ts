import Client from "./client";

const client = new Client("KACHANOV_DISCORD_TOKEN");
client.start().catch(console.error);