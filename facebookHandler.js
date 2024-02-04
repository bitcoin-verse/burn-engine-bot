const axios = require("axios");

async function handleFacebookPost(message) {
    try {
        const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;
        const url = `https://graph.facebook.com/${pageId}/feed`;

        await axios.post(url, {
            message: message,
            access_token: pageAccessToken
        });
    } catch (error) {
        console.error("Error posting to Facebook:", error);
    }
}

module.exports = { handleFacebookPost };
