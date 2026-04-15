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

};                    return data.generated_image_addresses;
                }

                if (data.draw_status === "FAILED") {
                    throw new Error("فشل التوليد");
                }

                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    // 🔥 GET API
    app.get("/api/aimirror", async (req, res) => {
        try {
            const imageUrl = req.query.url;

            if (!imageUrl) {
                return res.status(400).json({
                    status: false,
                    message: "📌 حط رابط الصورة ?url="
                });
            }

            // 🔽 تحميل الصورة
            const buffer = await Helper.urlToBuffer(imageUrl);

            // 🔽 تجهيز الرفع
            Helper.hash = Helper.sha1(crypto.randomUUID());
            const token = await Helper.fetchAppToken();
            Helper.imageKey = token.key;

            token.file = buffer;

            await Helper.uploadPhoto(token);

            // 🎨 توليد الصورة
            const generate = await Helper.requestDraw();
            const result = await Helper.wait(generate.draw_request_id);

            if (!result || !result.length) {
                return res.status(500).json({
                    status: false,
                    message: "❌ فشل توليد الصورة"
                });
            }

            res.json({
                status: true,
                input: imageUrl,
                result: result[0],
                message: "✅ تم توليد الصورة"
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
