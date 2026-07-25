const axios = require("axios");

module.exports = function (app) {

  app.post("/api/tiktok", async (req, res) => {

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "TERBO-SPAM",
        error: "حط رابط تيك توك في body باسم url"
      });
    }

    if (
      !url.includes("tiktok.com") &&
      !url.includes("vt.tiktok.com")
    ) {
      return res.status(400).json({
        status: false,
        creator: "TERBO-SPAM",
        error: "رابط تيك توك غير صحيح"
      });
    }

    try {

      const { data } = await axios.post(
        "https://www.vip-dl.com/api/info",
        {
          url: url
        },
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.124 Mobile Safari/537.36",

            "Accept-Encoding":
              "gzip, deflate, br, zstd",

            "Content-Type":
              "application/json",

            "sec-ch-ua-platform":
              '"Android"',

            "sec-ch-ua":
              '"Not;A=Brand";v="8", "Chromium";v="150", "Android WebView";v="150"',

            "sec-ch-ua-mobile":
              "?1",

            "origin":
              "https://www.vip-dl.com",

            "x-requested-with":
              "mark.via.gp",

            "sec-fetch-site":
              "same-origin",

            "sec-fetch-mode":
              "cors",

            "sec-fetch-dest":
              "empty",

            "referer":
              "https://www.vip-dl.com/",

            "accept-language":
              "en-GB,en-US;q=0.9,en;q=0.8",

            "priority":
              "u=1, i"
          },

          timeout: 60000
        }
      );

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result: data
      });

    } catch (error) {

      return res.status(500).json({
        status: false,
        creator: "TERBO-SPAM",
        error:
          error.response?.data ||
          error.message
      });

    }

  });

};
