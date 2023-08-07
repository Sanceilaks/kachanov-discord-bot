import { Client, GatewayIntentBits, Events, Partials } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.MessageContent
    ], 
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});


client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, message => {
    console.log(`${message.author.username}: ${message.content}`);
});

client.login(process.env.KACHANOV_DISCORD_TOKEN);