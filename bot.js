require("dotenv").config();
const Web3 = require("web3");
const TelegramBot = require("node-telegram-bot-api");

// Environment Variables
const infuraUrl = process.env.INFURA_URL;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatIds = process.env.TELEGRAM_CHAT_IDS.split(",");

// Web3 and Telegram Bot Setup
const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
const bot = new TelegramBot(botToken, { polling: true });

// Contract Details
const verseTokenAddress = "0x249cA82617eC3DfB2589c4c17ab7EC9765350a18";
const burnEngineAddress = "0x6b2a57dE29e6d73650Cb17b7710F2702b1F73CB8";
// Add your ABI JSON here
const verseTokenABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_initialSupply", type: "uint256" },
      { internalType: "uint256", name: "_minimumTimeFrame", type: "uint256" },
      { internalType: "bytes32", name: "_merkleRoot", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PERMIT_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_spender", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimer",
    outputs: [
      { internalType: "contract VerseClaimer", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_spender", type: "address" },
      { internalType: "uint256", name: "_subtractedValue", type: "uint256" },
    ],
    name: "decreaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_spender", type: "address" },
      { internalType: "uint256", name: "_addedValue", type: "uint256" },
    ],
    name: "increaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address", name: "_spender", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "uint8", name: "_v", type: "uint8" },
      { internalType: "bytes32", name: "_r", type: "bytes32" },
      { internalType: "bytes32", name: "_s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_from", type: "address" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]; // Replace with Verse Token ABI JSON
const burnEngineABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_burnCost", type: "uint256" },
      {
        internalType: "contract IVerseToken",
        name: "_verseToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InvalidValue", type: "error" },
  { inputs: [], name: "NoTokens", type: "error" },
  { inputs: [], name: "NoValue", type: "error" },
  { inputs: [], name: "NotMaster", type: "error" },
  { inputs: [], name: "NotProposed", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "manager",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newBurnCost",
        type: "uint256",
      },
    ],
    name: "BurnCostUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newMaster",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "previousMaster",
        type: "address",
      },
    ],
    name: "ClaimedOwnership",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "proposedMaster",
        type: "address",
      },
    ],
    name: "MasterProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousMaster",
        type: "address",
      },
    ],
    name: "RenouncedOwnership",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "burner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokensBurned",
    type: "event",
  },
  {
    inputs: [],
    name: "VERSE_TOKEN",
    outputs: [
      { internalType: "contract IVerseToken", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "adminBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "burnCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "master",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_proposedOwner", type: "address" },
    ],
    name: "proposeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "proposedMaster",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_newBurnCost", type: "uint256" },
    ],
    name: "setBurnCost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "userBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]; // Replace with Burn Engine ABI JSON

// Create Contract Instances
const verseTokenContract = new web3.eth.Contract(
  verseTokenABI,
  verseTokenAddress
);
const burnEngineContract = new web3.eth.Contract(
  burnEngineABI,
  burnEngineAddress
);

// Event Handlers
const handleTransfer = async (event) => {
  const valueWei = event.returnValues.value;
  const valueEth = web3.utils.fromWei(valueWei, "ether");

  const burnEngineBalanceWei = await verseTokenContract.methods
    .balanceOf(burnEngineAddress)
    .call();
  const burnEngineBalanceEth = web3.utils.fromWei(
    burnEngineBalanceWei,
    "ether"
  );

  const message =
    `Verse Token Transfer: ${valueEth} VERSE transferred to Burn Engine.\n` +
    `Burn Engine Verse Token Balance: ${burnEngineBalanceEth} VERSE`;

  postToTelegram(message);
};

const handleTokensBurned = async (event) => {
  const amountWei = event.returnValues.amount;
  const amountEth = web3.utils.fromWei(amountWei, "ether");
  const message = `Tokens Burned: 🔥${amountEth} VERSE burned!`;
  postToTelegram(message);
};

// Post to Multiple Telegram Chats with Debug Log
const postToTelegram = (message) => {
  console.log(`Sending message to Telegram: ${message}`);
  chatIds.forEach((chatId) => {
    bot.sendMessage(chatId, message).then(() => {
      console.log(`Message sent to chat ID ${chatId}`);
    }).catch((error) => {
      console.error(`Failed to send message to chat ID ${chatId}: ${error}`);
    });
  });
};

// Monitoring Loop
const monitorEvents = async () => {
  while (true) {
    try {
      const latestBlock = await web3.eth.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 50); // Last 50 blocks

      const transferEvents = await verseTokenContract.getPastEvents(
        "Transfer",
        {
          fromBlock: fromBlock,
          toBlock: "latest",
          filter: { to: burnEngineAddress },
        }
      );

      transferEvents.forEach((event) => handleTransfer(event));

      const tokensBurnedEvents = await burnEngineContract.getPastEvents(
        "TokensBurned",
        {
          fromBlock: fromBlock,
          toBlock: "latest",
        }
      );

      tokensBurnedEvents.forEach((event) => handleTokensBurned(event));

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
    } catch (e) {
      console.error(
        `[${new Date().toISOString()}] Error in event monitoring: ${e.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 60 seconds
    }
  }
};

// Start Monitoring
monitorEvents();

// Telegram Command Handlers
bot.onText(/\/burns/, async (msg) => {
  console.log(`Burns command detected from chat ID ${msg.chat.id}`);
  const chatId = msg.chat.id;
  const last5Burns = await burnEngineContract.getPastEvents("TokensBurned", {
    fromBlock: "latest",
    toBlock: "earliest",
    limit: 5,
  });

  let response = "Last 5 🔥Burns:\n";
  last5Burns.forEach((event) => {
    const txHash = event.transactionHash;
    const amount = web3.utils.fromWei(event.returnValues.amount, "ether");
    response += `Amount: ${amount} VERSE, Tx: [Etherscan](https://etherscan.io/tx/${txHash})\n`;
  });

  bot.sendMessage(chatId, response);
  console.log(`Response to /burns command: ${response}`);

});

bot.onText(/\/burnbalance/, async (msg) => {
  console.log(`Burnbalance command detected from chat ID ${msg.chat.id}`);
  const chatId = msg.chat.id;
  const balanceWei = await verseTokenContract.methods
    .balanceOf(burnEngineAddress)
    .call();
  const balanceEth = web3.utils.fromWei(balanceWei, "ether");
  const response = `Current Burn Engine Balance: ${balanceEth} VERSE`;

  bot.sendMessage(chatId, response);
  console.log(`Response to /burnbalance command: ${response}`);

});
