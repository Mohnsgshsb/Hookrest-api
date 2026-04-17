const axios = require("axios");
const yts = require("yt-search");

module.exports = async (req, res) => {

    const { name } = req.query;

    if (!name) {
        return res.status(400).json({
            status: false,
            message: "اكتب اسم الأغنية"
        });
    }

    try {

        // 🔍 بحث
        const search = await yts(name);

        if (!search.videos.length) {
            return res.status(404).json({
                status: false,
                message: "مفيش نتائج"
            });
        }

        const video = search.videos[0]; // أول نتيجة

        // 🎵 معلومات فقط
        const info = {
            status: true,
            title: video.title,
            author: video.author.name,
            duration: video.timestamp,
            views: video.views,
            uploaded: video.ago,
            thumbnail: video.thumbnail,
            url: video.url
        };

        // لو مش عايز تحميل، نرجّع المعلومات بس
        if (req.query.download !== "true") {
            return res.json(info);
        }

        // ⬇️ لو عايز تحميل كمان
        const ytdown = await axios.post(
            "https://hub.ytconvert.org/api/download",
            {
                url: video.url,
                os: "android",
                output: { type: "audio", format: "mp3" },
                audio: { bitrate: "128k" }
            },
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 15)",
                    "Content-Type": "application/json",
                    "origin": "https://media.ytmp3.gg",
                    "x-requested-with": "mark.via.gp",
                    "referer": "https://media.ytmp3.gg/"
                }
            }
        );

        const downloadUrl = ytdown.data.downloadUrl || ytdown.data.url;

        return res.json({
            ...info,
            download: downloadUrl || null
        });

    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message
        });
    }
};
