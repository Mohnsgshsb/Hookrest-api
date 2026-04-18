const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  app.get('/download/likee', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "حط لينك لايكي"
      });
    }

    try {
      // 1️⃣ نجيب الـ HTML من الموقع
      const { data } = await axios.post(
        'https://likeedownloader.com/process',
        new URLSearchParams({
          id: url,
          locale: 'ar'
        }),
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'x-requested-with': 'XMLHttpRequest',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': 'https://likeedownloader.com',
            'referer': 'https://likeedownloader.com/ar'
          }
        }
      );

      // 2️⃣ نسكراب HTML
      const $ = cheerio.load(data.template);

      // صورة المعاينة
      const thumbnail = $('.img_thumb img').attr('src') || null;

      // لينك بدون علامة مائية
      const noWatermark = $('.without_watermark').attr('href');

      if (!noWatermark) {
        return res.json({
          status: false,
          error: "مش لاقي لينك التحميل"
        });
      }

      // 3️⃣ فك التشفير (Base64)
      let finalUrl = noWatermark;

      try {
        const base64 = noWatermark.split('/').pop();
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');

        if (decoded.startsWith('http')) {
          finalUrl = decoded;
        }
      } catch (e) {
        // لو مش متشفر نسيبه زي ما هو
      }

      // 4️⃣ نرجع النتيجة
      res.json({
        status: true,
        result: {
          original_url: url,
          thumbnail,
          download: finalUrl
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
