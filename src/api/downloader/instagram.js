const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

  app.get("/api/nosa", async (req, res) => {
    const url = req.query.url;

    if (!url) {
      return res.json({
        status: false,
        creator: "Mohnd",
        message: "📌 حط لينك الانستجرام ?url="
      });
    }

    try {

      const form = new FormData();
      form.append("url", url);

      const response = await axios.post(
        "https://inflact.com/downloader/api/downloader/post/",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/146 Mobile Safari/537.36",
            "Accept-Encoding": "gzip, deflate, br",
            "sec-ch-ua-platform": '"Android"',
            "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
            "sec-ch-ua-mobile": "?1",
            "origin": "https://inflact.com",
            "x-requested-with": "mark.via.gp",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            "referer": "https://inflact.com/instagram-downloader/",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "priority": "u=1, i"
          },
          timeout: 20000,
          validateStatus: () => true
        }
      );

      const data = response.data;

      if (!data || data.status !== "success") {
        return res.json({
          status: false,
          creator: "Mohnd",
          message: "❌ فشل التحميل",
          raw: data
        });
      }

      const post = data.data?.post;

      if (!post) {
        return res.json({
          status: false,
          message: "❌ مفيش بيانات"
        });
      }

      let results = [];

      // فيديو
      if (post.video_url) {
        results.push({
          type: "video",
          url: post.video_url
        });
      }

      // صور
      if (Array.isArray(post.display_resources)) {
        for (const img of post.display_resources) {
          results.push({
            type: "image",
            url: img.src
          });
        }
      }

      return res.json({
        status: true,
        creator: "Mohnd",
        input: url,
        type: post.__typename || "unknown",
        thumbnail: post.thumbnail_src || null,
        caption: post.edge_media_to_caption?.edges?.[0]?.node?.text || "",
        author: post.owner?.username || "",
        results
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: "Mohnd",
        message: "⚠️ حصل خطأ",
        error: err.message
      });
    }
  });

};
