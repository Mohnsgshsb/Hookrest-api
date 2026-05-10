const axios = require('axios');
const yts = require('yt-search');

module.exports = function(app) {

    const ytdown = {

        api: {
            download: "https://hub.ytconvert.org/api/download"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },

        sleep: (ms) => new Promise(r => setTimeout(r, ms)),

        request: async (url) => {

            const res = await axios.post(
                ytdown.api.download,
                {
                    url,
                    os: 'android',
                    output: {
                        type: 'audio',
                        format: 'mp3'
                    },
                    audio: {
                        bitrate: '128k'
                    }
                },
                {
                    headers: ytdown.headers
                }
            );

            let data = res.data;

            // لو لسه بيجهز الملف
            if (data.statusUrl) {

                for (let i = 0; i < 15; i++) {

                    const check = await axios.get(data.statusUrl, {
                        headers: ytdown.headers
                    });

                    const result = check.data;

                    // أول ما يجيب رابط التحميل يوقف فورًا
                    if (result.downloadUrl || result.url) {
                        return result.downloadUrl || result.url;
                    }

                    await ytdown.sleep(1000);
                }
            }

            return data.downloadUrl || data.url || null;
        }
    };

    // API
    app.get('/api/play', async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'اكتب اسم الأغنية'
            });
        }

        try {

            // أول نتيجة فقط
            const search = await yts(q);

            if (!search.videos.length) {
                return res.status(404).json({
                    status: false,
                    error: 'مفيش نتائج'
                });
            }

            const video = search.videos[0];

            // استخراج رابط التحميل المباشر
            const direct = await ytdown.request(video.url);

            return res.json({
                status: true,
                title: video.title,
                download: direct
            });

        } catch (err) {

            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
