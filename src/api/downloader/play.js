const axios = require('axios');
const yts = require('yt-search');

module.exports = function (app) {

    const ytdown = {
        api: 'https://api.delirius.store/download/ytmp3v2',

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.124 Mobile Safari/537.36',
            'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'x-requested-with': 'mark.via.gp',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
        },

        isUrl: (str) => {
            try {
                new URL(str);
                return true;
            } catch {
                return false;
            }
        },

        download: async (link) => {
            if (!link) throw new Error('حط لينك 🗿');
            if (!ytdown.isUrl(link)) throw new Error('لينك غلط 🗿');

            const response = await axios.get(ytdown.api, {
                params: {
                    url: link
                },
                headers: ytdown.headers,
                timeout: 60000
            });

            const data = response.data;

            if (!data?.success || !data?.data?.download) {
                throw new Error('فشل تحميل الصوت');
            }

            return {
                success: true,
                title: data.data.title || null,
                author: data.data.author || null,
                channel: data.data.channel || null,
                views: data.data.views || null,
                likes: data.data.likes || null,
                image: data.data.image || null,
                format: data.data.format || 'mp3',
                download: data.data.download
            };
        }
    };


    // البحث عن الأغنية وتحميلها
    app.get('/api/play', async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Query is required'
            });
        }

        try {

            // البحث في يوتيوب
            const ytResults = await yts.search(q);
            const firstVideo = ytResults.videos[0];

            if (!firstVideo) {
                return res.status(404).json({
                    status: false,
                    error: 'No results found'
                });
            }

            // رابط الفيديو
            const videoUrl = firstVideo.url;

            // تحميل MP3 من الاسكراب الجديد
            const downloadResult = await ytdown.download(videoUrl);

            // الرد النهائي
            res.status(200).json({
                status: true,

                video: {
                    title: firstVideo.title,
                    channel: firstVideo.author?.name || null,
                    duration: firstVideo.duration?.timestamp || null,
                    imageUrl: firstVideo.thumbnail,
                    link: firstVideo.url
                },

                download: downloadResult
            });

        } catch (error) {

            console.error('YT PLAY ERROR:', error.message);

            res.status(500).json({
                status: false,
                error: error.message
            });

        }

    });

};
