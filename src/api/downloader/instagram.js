const axios = require("axios");
const cheerio = require("cheerio");
const CryptoJS = require("crypto-js");

module.exports = function (app) {

    const BASE = "https://reelsvideo.io";

    const HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'hx-request': 'true',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': BASE,
        'Referer': BASE
    };

    function ts() {
        return Math.floor(Date.now() / 1000);
    }

    function tt(t) {
        return CryptoJS.MD5(t + 'X-Fc-Pp-Ty-eZ').toString();
    }

    async function reelsvideo(url) {

        // 🔥 1 - open homepage (fix 500 / session issue)
        await axios.get(BASE, { headers: HEADERS });

        const t = ts();
        const sign = tt(t);

        const body = new URLSearchParams({
            id: url,
            locale: "en",
            "cf-turnstile-response": "",
            tt: sign,
            ts: t
        });

        // 🔥 2 - request real endpoint
        const res = await axios.post(
            `${BASE}/reel/DUU67gXiTwU/`,
            body,
            { headers: HEADERS, timeout: 30000 }
        );

        const $ = cheerio.load(res.data);

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

        return { type, videos, images, mp3 };
    }

    app.get("/api/nosa", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك"
            });
        }

        try {
            const result = await reelsvideo(url);

            res.json({
                status: true,
                creator: "Mohnd",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};};
