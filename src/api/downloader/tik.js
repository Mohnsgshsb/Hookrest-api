const axios = require("axios");

module.exports = function (app) {

    const tiktok = {

        headers: {
            "User-Agent": "Mozilla/5.0",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "origin": "https://lovetik.com",
            "referer": "https://lovetik.com/"
        },

        request: async (url) => {
            const { data } = await axios.post(
                "https://lovetik.com/api/ajax/search",
                new URLSearchParams({ query: url }),
                { headers: tiktok.headers }
            );
            return data;
        },

        pickBest: (links, type) => {
            if (type === "mp3") {
                return links.find(v => v.ft == 3 || v.s?.includes("MP3"));
            }

            return (
                links.find(v => v.s?.includes("HD Original")) ||
                links.find(v => v.s?.includes("1282p")) ||
                links.find(v => v.s?.includes("1024p")) ||
                links.find(v => v.s?.includes("854p")) ||
                links.find(v => v.ft == 1) ||
                links[0]
            );
        },

        parse: (data, type) => {
            const best = tiktok.pickBest(data.links, type);

            if (!best?.a) throw new Error("No download link found");

            return {
                status: true,
                type,
                title: data.desc || "TikTok",
                author: data.author_name || "Unknown",
                cover: data.cover,
                download: best.a,
                quality: best.s || "default"
            };
        }
    };

    // =========================
    // 🎥 MP4 API
    // =========================
    app.get("/api/tiktok", async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "URL required"
                });
            }

            const data = await tiktok.request(url);
            if (!data?.status) throw new Error("Failed to fetch data");

            const result = tiktok.parse(data, "mp4");

            res.json({ status: true, result });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // =========================
    // 🎧 MP3 API
    // =========================
    app.get("/api/tiktok-mp3", async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "URL required"
                });
            }

            const data = await tiktok.request(url);
            if (!data?.status) throw new Error("Failed to fetch data");

            const result = tiktok.parse(data, "mp3");

            res.json({ status: true, result });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
