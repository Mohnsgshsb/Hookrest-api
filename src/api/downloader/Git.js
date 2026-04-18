const axios = require("axios");
const yts = require("yt-search");

module.exports = function (app) {

    const ytdown = {
        api: {
            download: "https://hub.ytconvert.org/api/download"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15)',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json',
            'origin': 'https://media.ytmp3.gg',
            'x-requested-with': 'mark.via.gp',
            'referer': 'https://media.ytmp3.gg/'
        },

        sleep: (ms) => new Promise(r => setTimeout(r, ms)),

        request: async (url) => {
            const res = await axios.post(
                ytdown.api.download,
                {
                    url,
                    os: "android",
                    output: { type: "audio", format: "mp3" },
                    audio: { bitrate: "128k" }
                },
                { headers: ytdown.headers }
            );

            let data = res.data;

            if (data.statusUrl) {
                for (let i = 0; i < 20; i++) {
                    const check = await axios.get(data.statusUrl, {
                        headers: ytdown.headers
                    });

                    data = check.data;

                    if (data.downloadUrl || data.url) break;

                    await ytdown.sleep(2000);
                }
            }

            return data;
        }
    };

    // 🔥 SEARCH + AUTO DOWNLOAD (FIRST RESULT ONLY)
    app.get("/api/ytmp3/search", async (req, res) => {

        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                status: false,
                message: "اكتب اسم الأغنية"
            });
        }

        try {

            // 1️⃣ بحث
            const search = await yts(name);

            if (!search.videos.length) {
                return res.status(404).json({
                    status: false,
                    message: "مفيش نتائج"
                });
            }

            // 2️⃣ أول نتيجة بس
            const video = search.videos[0];

            // 3️⃣ تحميل مباشر
            const result = await ytdown.request(video.url);

            // 4️⃣ رجع لينك التحميل فقط
            const download = result.downloadUrl || result.url;

            if (!download) {
                return res.status(500).json({
                    status: false,
                    message: "فشل التحميل"
                });
            }

            const audio = await axios.get(download, {
                responseType: "stream"
            });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="song.mp3"`
            );

            audio.data.pipe(res);

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
