const TwitterApi = require("twitter-api-v2").default;

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
});

async function postTweet(message) {
    try {
        await twitterClient.v2.tweet(message);
    } catch (error) {
        console.error("Error posting to Twitter:", error);
    }
}

async function handleTwitterResponse(tweetId, responseMessage) {
    try {
        await twitterClient.v2.reply(responseMessage, tweetId);
    } catch (error) {
        console.error("Error responding on Twitter:", error);
    }
}

module.exports = { postTweet, handleTwitterResponse };
