const yts = require('yt-search');
const ytdl = require('ytdl'); // تغيير إلى ytdl (بدون core)

module.exports = function(app) {

    app.get('/video', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Query is required'
            });
        }

        try {
            // 🔎 بحث عن الفيديو
            const search = await yts(q);
            const video = search.videos[0];

            if (!video) {
                return res.status(404).json({
                    status: false,
                    error: 'No results'
                });
            }

            // ⚡ تحميل الفيديو مباشرة باستخدام ytdl
            const videoUrl = video.url;

            res.json({
                status: true,
                result: {
                    title: video.title,
                    channel: video.author.name,
                    views: video.views,
                    duration: video.timestamp,
                    thumbnail: video.thumbnail,
                    url: video.url,
                },
                download: {
                    video: videoUrl  // إرجاع رابط تحميل الفيديو مباشرة
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
