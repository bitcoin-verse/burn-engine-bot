import os
import json
from web3 import Web3
from telegram import Bot
from telegram.ext import CommandHandler, Updater, CallbackContext
import threading
import time

# Fetching environment variables
infura_url = os.getenv("INFURA_URL")
bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
chat_ids = os.getenv("TELEGRAM_CHAT_IDS").split(",")  # Split the chat IDs into a list

# Check if environment variables are set
if not infura_url or not bot_token or not chat_ids:
    raise ValueError("Environment variables for Infura URL, Telegram Bot Token, or Chat IDs are missing")

# Web3 and Telegram Bot Setup
web3 = Web3(Web3.HTTPProvider(infura_url))
bot = Bot(token=bot_token)
# Contract Details
verse_token_address = "0x249cA82617eC3DfB2589c4c17ab7EC9765350a18"
burn_engine_address = "0x6b2a57dE29e6d73650Cb17b7710F2702b1F73CB8"
verse_token_abi = json.loads([{"inputs":[{"internalType":"uint256","name":"_initialSupply","type":"uint256"},{"internalType":"uint256","name":"_minimumTimeFrame","type":"uint256"},{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimer","outputs":[{"internalType":"contract VerseClaimer","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"uint256","name":"_deadline","type":"uint256"},{"internalType":"uint8","name":"_v","type":"uint8"},{"internalType":"bytes32","name":"_r","type":"bytes32"},{"internalType":"bytes32","name":"_s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}])
burn_engine_abi = json.loads([{"inputs":[{"internalType":"uint256","name":"_burnCost","type":"uint256"},{"internalType":"contract IVerseToken","name":"_verseToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"InvalidValue","type":"error"},{"inputs":[],"name":"NoTokens","type":"error"},{"inputs":[],"name":"NoValue","type":"error"},{"inputs":[],"name":"NotMaster","type":"error"},{"inputs":[],"name":"NotProposed","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"manager","type":"address"},{"indexed":false,"internalType":"uint256","name":"newBurnCost","type":"uint256"}],"name":"BurnCostUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newMaster","type":"address"},{"indexed":true,"internalType":"address","name":"previousMaster","type":"address"}],"name":"ClaimedOwnership","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"proposer","type":"address"},{"indexed":true,"internalType":"address","name":"proposedMaster","type":"address"}],"name":"MasterProposed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousMaster","type":"address"}],"name":"RenouncedOwnership","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"burner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokensBurned","type":"event"},{"inputs":[],"name":"VERSE_TOKEN","outputs":[{"internalType":"contract IVerseToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"adminBurn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"burnCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"master","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_proposedOwner","type":"address"}],"name":"proposeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proposedMaster","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newBurnCost","type":"uint256"}],"name":"setBurnCost","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"userBurn","outputs":[],"stateMutability":"nonpayable","type":"function"}])

# Create Contract Instances
verse_token_contract = web3.eth.contract(address=verse_token_address, abi=verse_token_abi)
burn_engine_contract = web3.eth.contract(address=burn_engine_address, abi=burn_engine_abi)

# Event Handlers
def handle_transfer(event):
    # Fetch the transfer details
    value_wei = event['args']['value']
    value_eth = web3.fromWei(value_wei, 'ether')

    # Fetch the Verse Token balance of the Burn Engine Contract
    burn_engine_balance_wei = verse_token_contract.functions.balanceOf(burn_engine_address).call()
    burn_engine_balance_eth = web3.fromWei(burn_engine_balance_wei, 'ether')

    # Compose and send the message
    message = (
        f"Verse Token Transfer: {value_eth} ETH transferred to Burn Engine.\n"
        f"Burn Engine Verse Token Balance: {burn_engine_balance_eth} ETH"
    )
    post_to_telegram(message)

def handle_tokens_burned(event):
    amount_wei = event['args']['amount']
    amount_eth = web3.fromWei(amount_wei, 'ether')
    message = f"Tokens Burned: {amount_eth} ETH burned."
    post_to_telegram(message)

def burns_command(update, context):
    # Fetch the last 5 'TokensBurned' events
    burns_filter = burn_engine_contract.events.TokensBurned.createFilter(fromBlock='latest', toBlock='earliest')
    last_5_burns = burns_filter.get_all_entries()[-5:]
    
    # Construct the response message
    response = "Last 5 Burns:\n"
    for event in last_5_burns:
        tx_hash = event['transactionHash'].hex()
        amount = web3.fromWei(event['args']['amount'], 'ether')
        response += f"Amount: {amount} ETH, Tx: [Etherscan](https://etherscan.io/tx/{tx_hash})\n"

    update.message.reply_text(response, parse_mode='Markdown')

# Set up the command handler
updater = Updater(bot_token, use_context=True)
dispatcher = updater.dispatcher
dispatcher.add_handler(CommandHandler('burns', burns_command))
updater.start_polling()

def burn_balance_command(update, context):
    # Fetch the current balance
    balance_wei = verse_token_contract.functions.balanceOf(burn_engine_address).call()
    balance_eth = web3.fromWei(balance_wei, 'ether')

    # Send the response
    response = f"Current Burn Engine Balance: {balance_eth} ETH"
    update.message.reply_text(response)

dispatcher.add_handler(CommandHandler('burnbalance', burn_balance_command))

# Post to Multiple Telegram Chats
def post_to_telegram(message):
    for chat_id in chat_ids:
        bot.send_message(chat_id=chat_id, text=message)

# Monitoring Loop
def monitor_events():
    while True:
        try:
            # Adjust the block range as needed
            latest_block = web3.eth.blockNumber
            from_block = max(0, latest_block - 50)  # Last 50 blocks

            # Verse Token Transfer Events
            transfer_filter = verse_token_contract.events.Transfer.createFilter(
                fromBlock=from_block, toBlock='latest', 
                argument_filters={'to': burn_engine_address})
            for event in transfer_filter.get_all_entries():
                handle_transfer(event)

            # Burn Engine TokensBurned Events
            tokens_burned_filter = burn_engine_contract.events.TokensBurned.createFilter(
                fromBlock=from_block, toBlock='latest')
            for event in tokens_burned_filter.get_all_entries():
                handle_tokens_burned(event)

            time.sleep(10)  # Regular polling interval

        except Exception as e:
            current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            print(f"[{current_time}] Error in event monitoring: {e}")
            time.sleep(60)  # Longer wait after an error

# Start Monitoring in a Separate Thread
threading.Thread(target=monitor_events).start()

