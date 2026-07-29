const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  async function musicalDown(url) {

    const { data } = await axios.post(
      "https://musicaldown.net/api/ajaxSearch",
      new URLSearchParams({
        q: url,
        cursor: "0",
        page: "0",
        lang: "ar"
      }).toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://musicaldown.net",
          "Referer": "https://musicaldown.net/ar",
          "sec-ch-ua-platform": '"Android"',
          "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Android WebView";v="150"',
          "sec-ch-ua-mobile": "?1",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          "accept-language": "ar,en-US;q=0.9,en;q=0.8"
        },
        timeout: 60000
      }
    );

    if (data.status !== "ok")
      throw new Error("فشل استخراج الفيديو");

    const $ = cheerio.load(data.data);

    const result = {
      title: $(".content h3").text().trim() || null,
      thumbnail: $(".image-tik img").attr("src") || null,
      tiktok_id: $("#TikTokId").val() || null,
      downloads: []
    };

    $(".tik-button-dl").each((_, el) => {

      const name = $(el).text().replace(/\s+/g, " ").trim();
      const url = $(el).attr("href");

      if (!url) return;

      let type = "other";

      if (/mp3/i.test(name)) {
        type = "audio";
      } else if (/hd/i.test(name)) {
        type = "video_hd";
      } else if (/mp4/i.test(name)) {
        type = "video";
      }

      result.downloads.push({
        type,
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

      const result = await musicalDown(url);

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result
      });

    } catch (e) {

      res.status(500).json({
        status: false,
        creator: "TERBO-SPAM",
        error: e.response?.data || e.message
      });

    }

  });

};
