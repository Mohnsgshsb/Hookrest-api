const axios = require("axios");

module.exports = function (app) {

  const fastdl = {

    getData: async (url) => {
      const res = await axios.post(
        "https://api-wh.fastdl.app/api/convert",
        new URLSearchParams({
          sf_url: url
        }),
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json, text/plain, */*",
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "origin": "https://fastdl.app",
            "referer": "https://fastdl.app/"
          }
        }
      );

      return res.data;
    },

    extract: (data) => {

      const urls =
        data?.url ||
        data?.result?.url ||
        data?.data?.url ||
        data?.data?.result?.url ||
        [];

      if (!Array.isArray(urls) || urls.length === 0) return [];

      return urls.map(v => ({
        url: v.url || v.src || v.link,
        type: v.type || "unknown",
        ext: v.ext || "mp4",
        name: v.name || "file"
      }));
    }

  };

  // =========================
  // API ENDPOINT
  // =========================
  app.get("/api/nosa", async (req, res) => {

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "📌 حط لينك انستجرام ?url="
      });
    }

    try {

      const data = await fastdl.getData(url);

      if (!data || data.status === "error") {
        return res.json({
          status: false,
          message: "❌ فشل التحميل",
          raw: data
        });
      }

      const results = fastdl.extract(data);

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        meta: data.meta || null,
        thumb: data.thumb || null,
        results
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
