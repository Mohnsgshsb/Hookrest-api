const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

  app.get("/api/nosa", async (req, res) => {
    try {
      const url = req.query.url;

      if (!url) {
        return res.json({
          status: false,
          message: "📌 حط لينك الانستجرام ?url="
        });
      }

      const form = new FormData();
      form.append("url", url);

      const response = await axios.post(
        "https://inflact.com/downloader/api/downloader/post/",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36",
            "Accept-Encoding": "gzip, deflate, br, zstd",
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

      // 🎥 فيديو
      if (post.video_url) {
        results.push({
          type: "video",
          url: post.video_url
        });
      }

      // 🖼️ صور
      if (post.display_resources) {
        post.display_resources.forEach(img => {
          results.push({
            type: "image",
            url: img.src
          });
        });
      }

      res.json({
        status: true,
        input: url,
        type: post.__typename,
        thumbnail: post.thumbnail_src,
        caption: post.edge_media_to_caption?.edges?.[0]?.node?.text || "",
        author: post.owner?.username,
        results
      });

    } catch (err) {
      console.error("IGDL ERROR:", err.message);

      res.json({
        status: false,
        message: "⚠️ حصل خطأ",
        error: err.message
      });
    }
  });

};
