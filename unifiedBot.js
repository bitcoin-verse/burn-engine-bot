require("dotenv").config();
const Web3 = require("web3");
const axios = require("axios");
const { handleTelegramPost, handleTelegramCommand, notifyError } = require("./handlers/telegramHandler");
const { handleSlackPost } = require("./handlers/slackHandler");
const { handleFacebookPost } = require("./handlers/facebookHandler");
const { handleDiscordPost } = require("./handlers/discordHandler");
const { handleTwitterPost } = require("./handlers/twitterHandler");

// Web3 Setup
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
const verseTokenABI = require("./VerseTokenABI.json");
const verseTokenAddress = "0x249cA82617eC3DfB2589c4c17ab7EC9765350a18";
const verseTokenContract = new web3.eth.Contract(verseTokenABI, verseTokenAddress);

let verseUsdRate = 0;
let lastProcessedBlock = 0;

// Fetch USD Rate
async function fetchVerseUsdRate() {
  try {
    const response = await axios.get("https://markets.api.bitcoin.com/rates/convertor/?q=USD&c=VERSE");
    verseUsdRate = response.data.USD.rate;
  } catch (e) {
    console.error(`Error fetching USD rate: ${e.message}`);
    await notifyError(`Error fetching USD rate: ${e.message}`);
  }
}

// Format Amount
const formatAmount = (verseAmount) => {
  const formattedVerse = parseFloat(verseAmount).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const usdValue = verseAmount * verseUsdRate;
  return `${formattedVerse} $VERSE (~$${usdValue.toFixed(2)} USD)`;
};

// Fetch Circulating Supply
const fetchCirculatingSupply = async () => {
  try {
    const response = await axios.get("https://markets.api.bitcoin.com/coin/data/circulating?c=VERSE");
    return parseFloat(response.data);
  } catch (e) {
    console.error(`Error fetching circulating supply: ${e.message}`);
    await notifyError(`Error fetching circulating supply: ${e.message}`);
  }
};

// Event Handlers
const handleTransfer = async (event) => {
  await fetchVerseUsdRate();
  const valueWei = event.returnValues.value;
  const valueEth = web3.utils.fromWei(valueWei, "ether");
  const formattedMessage = formatAmount(valueEth);
  const message = `🚀 Verse Burn Engine Deposit: ${formattedMessage}`;
  await postUpdate(message);
};

const handleTokensBurned = async (event) => {
  await fetchVerseUsdRate();
  const amountWei = event.returnValues.amount;
  const amountEth = web3.utils.fromWei(amountWei, "ether");
  const formattedMessage = formatAmount(amountEth);
  const message = `🔥💥 Tokens Burned: ${formattedMessage}`;
  await postUpdate(message);
  await postUpdate(await getTotalBurnedResponse());
};

// Post Update Function
async function postUpdate(message) {
  try {
    console.log("Posting to Telegram...");
    await handleTelegramPost(message);
  } catch (error) {
    console.error("Error posting to Telegram:", error);
    await notifyError("Error posting to Telegram: " + error.message);
  }

  try {
    console.log("Posting to Slack...");
    await handleSlackPost(message);
  } catch (error) {
    console.error("Error posting to Slack:", error);
    await notifyError("Error posting to Slack: " + error.message);
  }

  try {
    console.log("Posting to Facebook...");
    await handleFacebookPost(message);
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    await notifyError("Error posting to Facebook: " + error.message);
  }

  try {
    console.log("Posting to Discord...");
    await handleDiscordPost(message);
  } catch (error) {
    console.error("Error posting to Discord:", error);
    await notifyError("Error posting to Discord: " + error.message);
  }

  try {
    console.log("Posting to Twitter...");
    await handleTwitterPost(message);
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    await notifyError("Error posting to Twitter: " + error.message);
  }
}

// Monitor Events
async function monitorEvents() {
  while (true) {
    try {
      const latestBlock = await web3.eth.getBlockNumber();
      const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : 18481385; // Starting block

      if (fromBlock <= latestBlock) {
        // Monitor transfers to the burn engine address
        const transferEvents = await verseTokenContract.getPastEvents("Transfer", {
          fromBlock: fromBlock,
          toBlock: "latest",
          filter: { to: "0x6b2a57dE29e6d73650Cb17b7710F2702b1F73CB8" }, // Burn engine address
        });
        transferEvents.forEach((event) => handleTransfer(event));

        // Monitor transfers to the null address (token burns)
        const burnEvents = await verseTokenContract.getPastEvents("Transfer", {
          fromBlock: fromBlock,
          toBlock: "latest",
          filter: { to: "0x0000000000000000000000000000000000000000" }, // Null address
        });
        burnEvents.forEach((event) => handleTokensBurned(event));

        lastProcessedBlock = latestBlock;
      }

      await new Promise(resolve => setTimeout(resolve, 30000)); // Pause for 30 seconds
    } catch (error) {
      console.error(`Error in event monitoring: ${error.message}`);
      await notifyError("Error in event monitoring: " + error.message);
      await new Promise(resolve => setTimeout(resolve, 60000)); // Pause for 60 seconds in case of error
    }
  }
}

// Initialize
async function initialize() {
  try {
    await fetchVerseUsdRate();
    lastProcessedBlock = await web3.eth.getBlockNumber();
    console.log(`Starting event monitoring from block: ${lastProcessedBlock}`);
    monitorEvents();
    handleTelegramCommand(); // Initialize Telegram commands
  } catch (e) {
    console.error(`Error during initialization: ${e.message}`);
    await notifyError("Error during initialization: " + e.message);
  }
}

initialize().catch(console.error);
