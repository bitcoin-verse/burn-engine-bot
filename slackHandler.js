const { WebClient } = require("@slack/web-api");

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

async function handleSlackPost(message) {
    try {
        await slackClient.chat.postMessage({
            channel: "#general",
            text: message
        });

        // Optionally post to another channel
        await slackClient.chat.postMessage({
            channel: "#verse",
            text: message
        });
    } catch (error) {
        console.error("Error posting to Slack:", error);
    }
}

module.exports = { handleSlackPost };
