const axios = require('axios');
const yts = require('yt-search');

module.exports = function (app) {

    const ytdown = {

        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.163 Mobile Safari/537.36",
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "origin": "https://vidssave.com",
            "referer": "https://vidssave.com/",
            "x-requested-with": "mark.via.gp"
        },

        isUrl(str) {
            try {
                new URL(str);
                return true;
            } catch {
                return false;
            }
        },

        async request(url) {

            const body = new URLSearchParams({
                auth: "20250901majwlqo",
                domain: "api-ak.vidssave.com",
                origin: "source",
                link: url
            });

            const { data } = await axios.post(
                "https://api.vidssave.com/api/contentsite_api/media/parse",
                body.toString(),
                {
                    headers: this.headers
                }
            );

            const media =
                data.medias ||
                data.media ||
                data.resources ||
                data.data ||
                [];

            const audio =
                media.find(v =>
                    v.type === "audio" &&
                    v.format === "MP3" &&
                    v.download_url
                ) ||
                media.find(v =>
                    v.type === "audio" &&
                    v.download_url
                );

            if (!audio)
                throw new Error("تعذر الحصول على رابط التحميل");

            return {
                success: true,
                title: data.title || null,
                duration: data.duration || null,
                download: audio.download_url,
                raw: audio
            };
        },

        async download(link) {
            if (!link) throw new Error("حط لينك 🗿");
            if (!this.isUrl(link)) throw new Error("لينك غلط 🗿");

            return await this.request(link);
        }

    };

    app.get("/api/playx", async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "Query is required"
            });
        }

        try {

            const results = await yts.search(q);

            const firstVideo = results.videos[0];

            if (!firstVideo) {
                return res.status(404).json({
                    status: false,
                    error: "No results found"
                });
            }

            const downloadResult = await ytdown.download(firstVideo.url);

            res.json({
                status: true,
                video: {
                    title: firstVideo.title,
                    channel: firstVideo.author.name,
                    duration: firstVideo.duration.timestamp,
                    imageUrl: firstVideo.thumbnail,
                    link: firstVideo.url
                },
                download: downloadResult
            });

        } catch (e) {

            res.status(500).json({
                status: false,
                error: e.message,
                details: e.response?.data || null
            });

        }

    });

};
