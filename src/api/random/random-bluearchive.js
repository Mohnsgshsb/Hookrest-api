const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

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

            // 🔥 تجهيز البيانات زي الموقع
            const data = qs.stringify({
                id: url,
                locale: "en",
                "cf-turnstile-response": "",
                tt: "fef583beae21c564cbe86a0a16bd68c7",
                ts: Date.now()
            });

            const response = await axios.post(
                "https://reelsvideo.io/",
                data,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "origin": "https://reelsvideo.io",
                        "referer": "https://reelsvideo.io/",
                        "hx-request": "true"
                    }
                }
            );

            const html = response.data;

            // 🔎 تحليل HTML
            const $ = cheerio.load(html);

            let results = [];

            $("a").each((i, el) => {
                const link = $(el).attr("href");

                if (link && link.includes(".mp4")) {
                    results.push({
                        type: "video",
                        url: link
                    });
                }
            });

            if (!results.length) {
                return res.status(404).json({
                    status: false,
                    message: "❌ مفيش نتائج (ممكن الموقع غير الحماية)"
                });
            }

            res.json({
                status: true,
                input: url,
                total: results.length,
                data: results,
                message: "✅ تم استخراج الفيديو"
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                status: false,
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};
