const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  async function saveTik(url) {

    const { data } = await axios.post(
      "https://savetik.co/api/ajaxSearch",
      new URLSearchParams({
        q: url,
        lang: "ar",
        cftoken: ""
      }).toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua-platform": '"Android"',
          "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Android WebView";v="150"',
          "sec-ch-ua-mobile": "?1",
          "origin": "https://savetik.co",
          "x-requested-with": "XMLHttpRequest",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          "referer": "https://savetik.co/ar",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "priority": "u=1, i"
        },
        timeout: 60000
      }
    );

    if (data.status !== "ok") {
      throw new Error("فشل الحصول على بيانات الفيديو");
    }

    const $ = cheerio.load(data.data);

    const result = {
      title: $(".content h3").text().trim() || null,
      thumbnail: $(".image-tik img").attr("src") || null,
      video: $("#vid").attr("data-src") || null,
      poster: $("#vid").attr("poster") || null,
      tiktok_id: $("#TikTokId").val() || null,
      downloads: []
    };

    $(".tik-button-dl").each((_, el) => {

      const name = $(el).text().replace(/\s+/g, " ").trim();
      const url = $(el).attr("href");

      if (!url || !url.startsWith("http")) return;

      result.downloads.push({
        name,
        url
      });

    });

    return result;
  }

  // ================= API =================

  app.get("/api/tiktok", async (req, res) => {

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "TERBO-SPAM",
        error: "حط رابط تيك توك في ?url="
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

      const result = await saveTik(url);

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result
      });

    } catch (err) {

      res.status(500).json({
        status: false,
        creator: "TERBO-SPAM",
        error: err.response?.data || err.message
      });

    }

  });

};
