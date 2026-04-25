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
            // 🔎 بحث سريع
            const search = await yts(q);
            const video = search.videos[0];

            if (!video) {
                return res.status(404).json({
                    status: false,
                    error: 'No results'
                });
            }

            // ⚡ بدون getInfo (أسرع)
            const audioUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

            res.json({
                status: true,
                result: {
                    title: video.title,
                    channel: video.author.name,
                    views: video.views,
                    duration: video.timestamp,
                    thumbnail: video.thumbnail,
                    url: video.url,

                    // رجّع اللينك الأساسي بدل processing تقيل
                    audio: audioUrl
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
