const axios = require("axios");

module.exports = function (app) {

  app.get("/api/igdl", async (req, res) => {
    try {
      const url = req.query.url;

      if (!url) {
        return res.status(400).json({
          status: false,
          message: "📌 حط رابط الانستجرام ?url="
        });
      }

      // 🔥 تجهيز البيانات
      const data = new URLSearchParams({
        id: url,
        locale: "en"
      });

      const response = await axios.post(
        "https://reelsvideo.io/",
        data.toString(),
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://reelsvideo.io",
            "referer": "https://reelsvideo.io/"
          },
          timeout: 10000,

          // 👇 أهم سطر يمنع 500
          validateStatus: () => true
        }
      );

      // ❌ لو الموقع رفض
      if (response.status !== 200) {
        return res.json({
          status: false,
          message: "❌ الموقع رفض الطلب",
          code: response.status
        });
      }

      const html = response.data;

      // ❌ تحقق من الرد
      if (!html || typeof html !== "string") {
        return res.json({
          status: false,
          message: "❌ رد غير صالح"
        });
      }

      // 🔎 استخراج mp4 (سريع وخفيف)
      const videos = html.match(/https?:\/\/[^"]+\.mp4/g) || [];

      // 🔎 استخراج صور كمان
      const images = html.match(/https?:\/\/[^"]+\.(jpg|jpeg|png)/g) || [];

      if (!videos.length && !images.length) {
        return res.json({
          status: false,
          message: "❌ مفيش نتائج (غالباً بلوك من الموقع)"
        });
      }

      res.json({
        status: true,
        input: url,
        total: videos.length + images.length,
        videos: videos.map(v => ({ url: v })),
        images: images.map(v => ({ url: v })),
        message: "✅ تم الاستخراج"
      });

    } catch (err) {
      console.error("IGDL ERROR:", err.message);

      // 👇 عمره ما يرجع 500
      res.json({
        status: false,
        message: "⚠️ حصل خطأ",
        error: err.message
      });
    }
  });

};
