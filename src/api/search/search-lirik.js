const yts = require('yt-search');
const ytdl = require('ytdl-core');

module.exports = function(app) {

    app.get('/song', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Query is required'
            });
        }

        try {
            // 1️⃣ البحث
            const search = await yts(q);
            const video = search.videos[0];

            if (!video) {
                return res.status(404).json({
                    status: false,
                    error: 'No results found'
                });
            }

            // 2️⃣ جلب معلومات الفيديو الكاملة
            const info = await ytdl.getInfo(video.url);

            // 3️⃣ اختيار أفضل صوت
            const audioFormat = ytdl.chooseFormat(info.formats, {
                quality: 'highestaudio'
            });

            // 4️⃣ إرسال النتيجة
            res.status(200).json({
                status: true,
                result: {
                    title: video.title,
                    description: video.description,
                    channel: video.author.name,
                    views: video.views,
                    duration: video.timestamp,
                    seconds: video.seconds,
                    uploadedAt: video.ago,
                    thumbnail: video.thumbnail,
                    url: video.url,

                    // 🔥 أهم حاجة
                    audio: audioFormat.url
                }
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

};
