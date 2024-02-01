require("dotenv").config();
const Web3 = require("web3");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Environment Variables
const infuraUrl = process.env.INFURA_URL;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatIds = process.env.TELEGRAM_CHAT_IDS.split(",");
const flamethrowerGifUrl =
  "https://media.giphy.com/media/B0yHMGZZLbBxS/giphy.gif"; // Replace with your GIF URL

// Web3 and Telegram Bot Setup
const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
const bot = new TelegramBot(botToken, { polling: true });

// Contract Details
const verseTokenAddress = "0x249cA82617eC3DfB2589c4c17ab7EC9765350a18";
const burnEngineAddress = "0x6b2a57dE29e6d73650Cb17b7710F2702b1F73CB8";

// Add your ABI JSON here
const verseTokenABI = require("./VerseTokenABI.json"); // Link to Verse Token ABI JSON
const burnEngineABI = require("./BurnEngineABI.json"); // Link to Burn Engine ABI JSON

// Create Contract Instances
const verseTokenContract = new web3.eth.Contract(
  verseTokenABI,
  verseTokenAddress
);
const burnEngineContract = new web3.eth.Contract(
  burnEngineABI,
  burnEngineAddress
);

let lastKnownBalanceEth = 0; // Variable to store the last known balance
let verseUsdRate = 0; // USD conversion rate for VERSE
let lastProcessedBlock = 0; // Variable to store the last processed block number

// Fetch USD rate for VERSE
const fetchVerseUsdRate = async () => {
  try {
    const response = await axios.get(
      "https://markets.api.bitcoin.com/rates/convertor/?q=USD&c=VERSE"
    );
    verseUsdRate = response.data.USD.rate;
    console.log(`Fetched USD rate for VERSE: ${verseUsdRate}`);
  } catch (e) {
    console.error(`Error fetching USD rate: ${e.message}`);
  }
};

// Format amount in VERSE and USD
const formatAmount = (verseAmount) => {
  const formattedVerse = parseFloat(verseAmount).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  const usdValue = verseAmount * verseUsdRate;
  const formattedUsd = usdValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  return `${formattedVerse} VERSE (~$${formattedUsd} USD)`;
};

// Initial Setup: Fetch the current balance of the Burn Engine
const initialize = async () => {
  try {
    const balanceWei = await verseTokenContract.methods
      .balanceOf(burnEngineAddress)
      .call();
    lastKnownBalanceEth = web3.utils.fromWei(balanceWei, "ether");
    lastProcessedBlock = await web3.eth.getBlockNumber(); // This sets the initial lastProcessedBlock

    console.log(`Initial Burn Engine Balance: ${lastKnownBalanceEth} VERSE`);
    await fetchVerseUsdRate(); // Fetch the initial conversion rate
    lastProcessedBlock = await web3.eth.getBlockNumber(); // Initialize the last processed block
    monitorEvents(); // Start monitoring events after initialization
  } catch (e) {
    console.error(`Error during initialization: ${e.message}`);
  }
};

// Event Handlers and Monitoring Loop (as previously defined)

// Post to Multiple Telegram Chats
const postToTelegram = (message) => {
  chatIds.forEach((chatId) => {
    bot.sendMessage(chatId, message);
  });
};

const postToTelegramWithGIF = (gifUrl) => {
  chatIds.forEach((chatId) => {
    bot.sendDocument(chatId, gifUrl);
  });
};

// Event Handlers
const handleTransfer = async (event) => {
  await fetchVerseUsdRate(); // Update the conversion rate
  const valueWei = event.returnValues.value;
  const valueEth = web3.utils.fromWei(valueWei, "ether");
  const formattedMessage = formatAmount(valueEth);

  const burnEngineBalanceWei = await verseTokenContract.methods
    .balanceOf(burnEngineAddress)
    .call();
  lastKnownBalanceEth = web3.utils.fromWei(burnEngineBalanceWei, "ether");
  const formattedBalance = formatAmount(lastKnownBalanceEth);

  const message =
    `🚀 Verse Token Deposited into Burn Engine: ${formattedMessage}\n` +
    `🔥 Updated Burn Engine Verse Token Balance: ${formattedBalance}`;
  postToTelegram(message);
};

const handleTokensBurned = async (event) => {
  await fetchVerseUsdRate(); // Update the conversion rate
  const amountWei = event.returnValues.amount;
  const amountEth = web3.utils.fromWei(amountWei, "ether");
  const formattedMessage = formatAmount(amountEth);

  lastKnownBalanceEth = 0; // Balance is zero after burn
  const message =
    `🔥💥 Tokens Burned: ${formattedMessage}\n` +
    `The burn engine's flames roar!`;
  postToTelegram(message);
  postToTelegramWithGIF(flamethrowerGifUrl); // Post the flamethrower GIF
};


const monitorEvents = async () => {
  while (true) {
      try {
          const latestBlock = await web3.eth.getBlockNumber();

          // Use startBlock if lastProcessedBlock is not initialized
          const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : 18481385;

          if (fromBlock <= latestBlock) {
              const tokensBurnedEvents = await burnEngineContract.getPastEvents('TokensBurned', {
                  fromBlock: fromBlock,
                  toBlock: 'latest'
              });

              tokensBurnedEvents.forEach(event => handleTokensBurned(event));
              lastProcessedBlock = latestBlock;
          }

          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait for 30 seconds
      } catch (e) {
          console.error(`Error in event monitoring: ${e.message}`);
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds in case of an error
      }
  }
};





const fetchCirculatingSupply = async () => {
  try {
      const response = await axios.get('https://markets.api.bitcoin.com/coin/data/circulating?c=VERSE');
      return response.data.circulatingSupply;
  } catch (e) {
      console.error(`Error fetching circulating supply: ${e.message}`);
      return null;
  }
};

// Function to fetch the last 5 'TokensBurned' events and format the response
const fetchLastFiveBurns = async () => {
  try {
      await fetchVerseUsdRate(); // Update the conversion rate

      const events = await burnEngineContract.getPastEvents('TokensBurned', {
          fromBlock: 'earliest',
          toBlock: 'latest'
      });

      // Get the last 5 events
      const lastFiveBurns = events.slice(-5).reverse();

      let response = "**🔥 Last 5 Burns**\n\n";
      lastFiveBurns.forEach(event => {
          const txHash = event.transactionHash;
          const amountWei = event.returnValues.amount;
          const amountEth = web3.utils.fromWei(amountWei, 'ether');
          const formattedMessage = formatAmount(amountEth);
          response += `🔥 Amount: ${formattedMessage} - [Etherscan](https://etherscan.io/tx/${txHash})\n\n`;
      });

      return response;
  } catch (e) {
      console.error(`Error fetching last five burns: ${e.message}`);
      return "Error fetching last five burns.";
  }
};

const handleTotalBurnedCommand = async () => {
  try {
      const startBlock = 18481385; // Burn engine launch block
      const totalSupply = 210e9; // 210 billion VERSE
      const circulatingSupply = await fetchCirculatingSupply() || totalSupply; // Fallback to total supply if API fails

      const events = await burnEngineContract.getPastEvents('TokensBurned', {
          fromBlock: startBlock,
          toBlock: 'latest'
      });

      const totalBurnedWei = events.reduce((sum, event) => sum + BigInt(event.returnValues.amount), BigInt(0));
      const totalBurnedEth = web3.utils.fromWei(totalBurnedWei.toString(), 'ether');
      const formattedTotalBurned = parseFloat(totalBurnedEth).toLocaleString('en-US', { maximumFractionDigits: 2 });
      const usdValue = totalBurnedEth * verseUsdRate;
      const formattedUsd = usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 });

      const totalBurnEvents = events.length;
      const totalSupplyBurnedPercent = (totalBurnedEth / totalSupply) * 100;
      const circulatingSupplyBurnedPercent = (totalBurnedEth / circulatingSupply) * 100;

      let response = "** Total Burned ** \n\n";
      response += `💥 Cumulative Tokens Burned: ${formattedTotalBurned} VERSE (~$${formattedUsd} USD)\n\n`;
      response += `🔢 Total Burn Engine Ignitions: ${totalBurnEvents}\n\n`;
      response += `📊 % of Total Supply Burned: ${totalSupplyBurnedPercent.toFixed(2)}%\n\n`;
      response += `🌐 % of Circulating Supply Burned: ${circulatingSupplyBurnedPercent.toFixed(2)}%\n\n`;
      response += `👨‍🚀 Visit [Burn Engine](https://verse.bitcoin.com/burn/) for detailed burn stats`;


      return response;
  } catch (e) {
      console.error(`Error in /totalburned command: ${e.message}`);
      return "Error processing /totalburned command.";
  }
};

bot.onText(/\/totalburned/, async (msg) => {
  const chatId = msg.chat.id;
  postToTelegramWithGIF(flamethrowerGifUrl); // Post the flamethrower GIF
  const response = await handleTotalBurnedCommand();
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});


// Telegram Command Handler for '/burns'
bot.onText(/\/burns/, async (msg) => {
  const chatId = msg.chat.id;
  const response = await fetchLastFiveBurns();
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});


// Telegram Command Handlers
bot.onText(/\/enginebalance/, async (msg) => {
  const chatId = msg.chat.id;
  let response;

  if (lastKnownBalanceEth > 0) {
    const formattedBalance = formatAmount(lastKnownBalanceEth);
    response = `🔥 Current Burn Engine Balance: ${formattedBalance}`;
  } else {
    await fetchVerseUsdRate(); // Update the conversion rate
    const balanceWei = await verseTokenContract.methods
      .balanceOf(burnEngineAddress)
      .call();
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");
    const formattedBalance = formatAmount(balanceEth);
    response = `🔥 Current Burn Engine Balance: ${formattedBalance}`;
  }

  bot.sendMessage(chatId, response);
});



// Start the application
initialize();
