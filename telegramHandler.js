const TelegramBot = require("node-telegram-bot-api");

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const myTelegramId = process.env.MY_TELEGRAM_ID; // Your Telegram User ID for receiving error notifications

// Function to post a message to Telegram
async function handleTelegramPost(message) {
    try {
        const chatIds = process.env.TELEGRAM_CHAT_IDS.split(",");
        chatIds.forEach(async chatId => {
            await bot.sendMessage(chatId, message);
        });
    } catch (error) {
        console.error("Error posting to Telegram:", error);
        await notifyError(`Error in Telegram Post: ${error.message}`);
    }
}

// Function to post a GIF to Telegram
async function handleTelegramPostWithGIF(gifUrl) {
    try {
        const chatIds = process.env.TELEGRAM_CHAT_IDS.split(",");
        chatIds.forEach(async chatId => {
            await bot.sendDocument(chatId, gifUrl);
        });
    } catch (error) {
        console.error("Error posting GIF to Telegram:", error);
        await notifyError(`Error in Telegram GIF Post: ${error.message}`);
    }
}

// Function to notify you via Telegram DM in case of errors
async function notifyError(errorMessage) {
    try {
        if (myTelegramId) {
            await bot.sendMessage(myTelegramId, `🚨 Alert: ${errorMessage}`);
        }
    } catch (error) {
        console.error("Error sending notification to Telegram:", error);
    }
}

// Function to set up Telegram commands
function setupTelegramCommands() {
    // Define your command handlers here
    // Example: /totalburned command
    bot.onText(/\/totalburned/, async msg => {
        const chatId = msg.chat.id;
        try {
            const response = await getTotalBurnedResponse(); // Replace with actual response function
            bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
        } catch (error) {
            await notifyError(
                `Error in Telegram Command /totalburned: ${error.message}`
            );
        }
    });

    // Add more command handlers as needed
}

module.exports = {
    handleTelegramPost,
    handleTelegramPostWithGIF,
    setupTelegramCommands,
    notifyError // Exporting for use in bot.js
};
