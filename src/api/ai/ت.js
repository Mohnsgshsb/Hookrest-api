const axios = require("axios");
const cheerio = require("cheerio");

const proxy = global.proxy || (() => null);

module.exports = function (app) {

    const otakudesu = {

        async download(url) {

            if (!url || !url.trim()) {
                throw new Error("حط لينك الحلقة");
            }

            try {
                const { data } = await axios.get(proxy() + url, {
                    timeout: 30000,
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Referer": "https://otakudesu.cloud/",
                        "Connection": "keep-alive"
                    }
                });

                const $ = cheerio.load(data);

                const result = {
                    title: $(".download h4").text().trim(),
                    downloads: [],
                };

                $(".download ul li").each((i, el) => {

                    const quality = $(el).find("strong").text().trim();

                    $(el).find("a").each((_, linkEl) => {

                        result.downloads.push({
                            quality,
                            host: $(linkEl).text().trim(),
                            link: $(linkEl).attr("href"),
                        });

                    });

                });

                if (result.downloads.length === 0) {
                    throw new Error("مفيش روابط تحميل");
                }

                return result;

            } catch (error) {
                console.error("API Error:", error.message);
                throw new Error("فشل في جلب البيانات");
            }
        }
    };

    // 🔥 GET
    app.get("/api/anime/otakudesu/download", async (req, res) => {

        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط ?url="
            });
        }

        try {
            const result = await otakudesu.download(url);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // 🔥 POST
    app.post("/api/anime/otakudesu/download", async (req, res) => {

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط url في body"
            });
        }

        try {
            const result = await otakudesu.download(url);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
