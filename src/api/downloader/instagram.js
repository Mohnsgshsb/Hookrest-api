const axios = require("axios");

module.exports = function (app) {

  const fastdl = {

    // طلب أولي عشان نجيب التوكنات والمتغيرات
    getInit: async (url) => {
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

    // محاولة استخراج روابط التحميل
    parse: (data) => {
      if (!data || !data.url) return null;

      return data.url.map(v => ({
        url: v.url,
        type: v.type,
        ext: v.ext,
        name: v.name
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
        error: "حط لينك انستجرام ?url="
      });
    }

    try {

      // 1) طلب API الأساسي
      const data = await fastdl.getInit(url);

      // 2) لو فيه error من الموقع
      if (!data || data.error) {
        return res.json({
          status: false,
          message: "فشل التحميل",
          raw: data
        });
      }

      // 3) استخراج الداتا
      const results = fastdl.parse(data);

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        meta: data.meta,
        thumb: data.thumb,
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
