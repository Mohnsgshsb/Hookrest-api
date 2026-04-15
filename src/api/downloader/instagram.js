const cheerio = require("cheerio");
const CryptoJS = require("crypto-js");
const axios = require("axios");

module.exports = function (app) {

  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "hx-request": "true",
    "hx-current-url": "https://reelsvideo.io/",
    "hx-target": "target",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://reelsvideo.io",
    "Referer": "https://reelsvideo.io/"
  };

  function generateTS() {
    return Math.floor(Date.now() / 1000);
  }

  function generateTT(ts) {
    return CryptoJS.MD5(ts + "X-Fc-Pp-Ty-eZ").toString();
  }

  async function reelsvideo(url) {
    const ts = generateTS();
    const tt = generateTT(ts);

    const body = new URLSearchParams();
    body.append("id", url);
    body.append("locale", "en");
    body.append("cf-turnstile-response", "");
    body.append("tt", tt);
    body.append("ts", ts);

    const res = await axios.post(
      "https://reelsvideo.io/",
      body,
      {
        headers: HEADERS,
        timeout: 30000
      }
    );

    const $ = cheerio.load(res.data);

    const username =
      $(".bg-white span.text-400-16-18").first().text().trim() || null;

    const thumb =
      $("div[data-bg]").first().attr("data-bg") || null;

    const videos = [];
    $("a.type_videos").each((_, el) => {
      const href = $(el).attr("href");
      if (href) videos.push(href);
    });

    const images = [];
    $("a.type_images").each((_, el) => {
      const href = $(el).attr("href");
      if (href) images.push(href);
    });

    const mp3 = [];
    $("a.type_audio").each((_, el) => {
      const href = $(el).attr("href");
      const id = $(el).attr("data-id");
      if (href && id) mp3.push({ id, url: href });
    });

    let type = "unknown";
    if (videos.length && images.length) type = "carousel";
    else if (videos.length) type = "video";
    else if (images.length) type = "photo";

    return { type, username, thumb, videos, images, mp3 };
  }

  // =========================
  // API ENDPOINT
  // =========================
  app.get("/api/nosa", async (req, res) => {

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "📌 حط لينك الريلز ?url="
      });
    }

    try {

      const data = await reelsvideo(url);

      if (!data || (!data.videos?.length && !data.images?.length)) {
        return res.json({
          status: false,
          message: "❌ مفيش نتائج",
          raw: data
        });
      }

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result: data
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
