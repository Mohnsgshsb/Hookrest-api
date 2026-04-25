const axios = require('axios');
const yts = require('yt-search');

module.exports = function(app) {

    const ytdown = {
        api: {
            download: "https://hub.ytconvert.org/api/download"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json'
        },

        sleep: (ms) => new Promise(r => setTimeout(r, ms)),

        request: async (url) => {
            const res = await axios.post(
                ytdown.api.download,
                {
                    url: url,
                    output: { type: 'audio', format: 'mp3' },
                    audio: { bitrate: '128k' }
                },
                { headers: ytdown.headers, timeout: 10000 } // ⏱️ مهم
            );

            let data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

            // 🔥 تقليل عدد المحاولات
            if (data.statusUrl) {
                let result;

                for (let i = 0; i < 8; i++) { // بدل 20
                    await ytdown.sleep(1000); // بدل 2000

                    const check = await axios.get(data.statusUrl, {
                        headers: ytdown.headers,
                        timeout: 10000
                    });

                    result = typeof check.data === "string"
                        ? JSON.parse(check.data)
                        : check.data;

                    if (result?.downloadUrl) break;
                }

                return result;
            }

            return data;
        },

        download: async (link) => {
            if (!link) throw new Error("حط لينك");
            return await ytdown.request(link);
        }
    };

    // ✅ endpoint نهائي
    app.get('/song', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Query is required'
            });
        }

        try {
            // 🔎 أول نتيجة فقط
            const search = await yts(q);
            const video = search.videos[0];

            if (!video) {
                return res.status(404).json({
                    status: false,
                    error: 'No results'
                });
            }

            // ⚡ تحميل
            const download = await ytdown.download(video.url);

            res.json({
                status: true,
                result: {
                    title: video.title,
                    channel: video.author.name,
                    duration: video.timestamp,
                    views: video.views,
                    thumbnail: video.thumbnail,
                    url: video.url
                },
                download: {
                    url: download?.downloadUrl || null
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
