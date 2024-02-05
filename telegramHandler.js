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
function setupTelegramCommands({ fetchLastFiveBurns, fetchEngineBalance, handleTotalVerseBurnedCommand, notifyError }) {
    bot.onText(/\/burns/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const response = await fetchLastFiveBurns();
            bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
        } catch (error) {
            notifyError(`Error in /burns command: ${error.message}`);
            bot.sendMessage(chatId, "Sorry, there was an error processing your /burns command.");
        }
    });

    bot.onText(/\/enginebalance/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const response = await fetchEngineBalance();
            bot.sendMessage(chatId, response);
        } catch (error) {
            notifyError(`Error in /enginebalance command: ${error.message}`);
            bot.sendMessage(chatId, "Sorry, there was an error processing your /enginebalance command.");
        }
    });

    bot.onText(/\/totalburned/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const response = await getTotalBurnedResponse();
            bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
        } catch (error) {
            notifyError(`Error in /totalburned command: ${error.message}`);
            bot.sendMessage(chatId, "Sorry, there was an error processing your /totalburned command.");
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
