const { Client, Intents } = require("discord.js");
const discordClient = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

async function handleDiscordPost(message) {
    try {
        discordClient.on("ready", () => {
            const generalChannel = discordClient.channels.cache.find(
                channel => channel.name === "general"
            );
            generalChannel.send(message);
            const verseChannel = discordClient.channels.cache.find(
                channel => channel.name === "verse"
            );
            verseChannel.send(message);
        });
    } catch (error) {
        console.error("Error posting to Discord:", error);
    }
}

module.exports = { handleDiscordPost };
