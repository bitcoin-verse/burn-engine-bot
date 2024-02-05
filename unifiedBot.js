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
let lastKnownBalanceEth = 0; 

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

async function handleTransfer(event) {
  await fetchVerseUsdRate();
  const valueWei = event.returnValues.value;
  const valueEth = Number(web3.utils.fromWei(valueWei, "ether"));

  const burnEngineBalanceWei = await verseTokenContract.methods.balanceOf("0x6b2a57dE29e6d73650Cb17b7710F2702b1F73CB8").call();
  lastKnownBalanceEth = Number(web3.utils.fromWei(burnEngineBalanceWei, "ether"));

  const tweetMessage =
    `🚀 $Verse Burn Engine Deposit Detected: ${numberWithCommas(
      valueEth.toFixed(2)
    )} VERSE (~$${numberWithCommas(
      (valueEth * verseUsdRate).toFixed(2)
    )} USD)\n` +
    `🔥 Current Burn Engine Balance: ${numberWithCommas(
      lastKnownBalanceEth.toFixed(2)
    )} VERSE (~$${numberWithCommas(
      (lastKnownBalanceEth * verseUsdRate).toFixed(2)
    )} USD)\n` +
    `🔥 Ignite the $Verse Burn Engine with 10,000 $VERSE at https://verse.bitcoin.com/burn and set all $VERSE ablaze!`;
  await postTweet(tweetMessage);
}


const burnMessages = [
  "🔥 $VERSE is ablaze with another burn!",
  "💥 The burn engine roars with $VERSE energy!",
  "🚀 $VERSE just got hotter with this burn!",
  "🔥 Feel the heat? That's another $VERSE burn!",
  "💥 Boom! Another batch of $VERSE bites the dust!",
  "🚀 Blazing through $VERSE with another fiery burn!",
  "🔥 The $VERSE furnace is burning bright!",
  "💥 A scorching $VERSE burn just took place!",
  "🚀 Rockets ignited! $VERSE is burning up!",
  "🔥 $VERSE just fueled the flames of the burn engine!",
  "💥 $VERSE inferno! Another burn executed!",
  "🚀 Blast off! $VERSE burn is a go!",
  "🔥 $VERSE incineration in progress!",
  "💥 Sizzling hot! $VERSE burn achieved!",
  "🚀 Up in flames! Another $VERSE burn completed!",
  "🔥 The $VERSE pyre blazes once more!",
  "💥 Feel the burn! $VERSE is at it again!",
  "🚀 $VERSE burn-off: Spectacular and fiery!",
  "🔥 Turning up the heat with $VERSE!",
  "💥 Flare-up detected in the $VERSE burn engine!",
  "🚀 Another $VERSE combustion, brilliantly done!",
  "🔥 $VERSE is sizzling away in the burn chamber!",
  "💥 Sparking a $VERSE blaze with this burn!",
  "🚀 The $VERSE flame dances with another burn!",
  "🔥 $VERSE burn: a fiery spectacle!",
];

// Randomly select a message
function getRandomBurnMessage() {
  const randomIndex = Math.floor(Math.random() * burnMessages.length);
  return burnMessages[randomIndex];
}

const handleTokensBurned = async (event) => {
  await fetchVerseUsdRate();
  const amountWei = event.returnValues.amount;
  const amountEth = web3.utils.fromWei(amountWei, "ether");
  const formattedMessage = formatAmount(amountEth);
  const etherscanUrl = `https://etherscan.io/tx/${event.transactionHash}`; // Adjust as needed for Etherscan URL format

  const message = `🔥💥 $VERSE Burn Detected: ${formattedMessage}\n\n${getRandomBurnMessage()}\n\nView on Etherscan: ${etherscanUrl}`;
  await postUpdate(message);
  await postUpdate(await getTotalBurnedResponse());
};


async function handleTotalVerseBurnedCommand(isTelegramCommand = false) {
  try {
    console.log('Fetching total Verse burned...');

    const nullAddress = "0x0000000000000000000000000000000000000000";
    const startBlock = 16129240; // Block when Verse token was created
    const totalSupply = 210e9; // 210 billion VERSE
    const circulatingSupply = await fetchCirculatingSupply();

    console.log(`Fetching Transfer events to null address from block ${startBlock}...`);

    const transferEventsToNull = await verseTokenContract.getPastEvents("Transfer", {
      fromBlock: startBlock,
      toBlock: "latest",
      filter: { to: nullAddress }
    });

    const totalBurnedWei = transferEventsToNull.reduce(
      (sum, event) => sum + BigInt(event.returnValues.value),
      BigInt(0)
    );
    const totalBurnedEth = web3.utils.fromWei(totalBurnedWei.toString(), "ether");
    const totalBurnEvents = transferEventsToNull.length;
    const totalSupplyBurnedPercent = (totalBurnedEth / totalSupply) * 100;
    const circulatingSupplyBurnedPercent = circulatingSupply ? (totalBurnedEth / circulatingSupply) * 100 : null;

    let response = `** Total VERSE Burned ** \n\n` +
                   `🔥 Cumulative Verse Tokens Burned: ${totalBurnedEth.toFixed(2)} VERSE\n` +
                   `🔥 Total Burn Events: ${totalBurnEvents}\n` +
                   `📊 % of Total Supply Burned: ${totalSupplyBurnedPercent.toFixed(4)}%\n`;
    
    if (circulatingSupplyBurnedPercent) {
      response += `🌐 % of Circulating Supply Burned: ${circulatingSupplyBurnedPercent.toFixed(4)}%\n`;
    }
    
    response += `👨‍🚀 Visit [Burn Engine](https://verse.bitcoin.com/burn/) for detailed burn stats`;

    if (isTelegramCommand) {
      // If invoked by a Telegram command, return the message for Telegram response
      return response;
    } else {
      // Otherwise, post this message to all platforms
      await postUpdate(response);
    }
  } catch (e) {
    console.error(`Error in handleTotalVerseBurnedCommand: ${e.message}`);
    await notifyError('Error in handleTotalVerseBurnedCommand: ' + e.message);
  }
}

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
    
    // Start event monitoring
    monitorEvents();

    // Initialize Telegram commands
    handleTelegramCommand();
    setupTelegramCommands({
      verseTokenContract,
      fetchLastFiveBurns,
      fetchEngineBalance,
      handleTotalVerseBurnedCommand,
      notifyError
    });
  } catch (e) {
    console.error(`Error during initialization: ${e.message}`);
    await notifyError("Error during initialization: " + e.message);
  }
}

initialize();
