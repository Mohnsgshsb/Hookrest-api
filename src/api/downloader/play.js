const axios = require('axios');
const yts = require('yt-search');

module.exports = function (app) {

    const ytdown = {

        api: 'https://www.emam-api.web.id/home/sections/Download/api/api/download',

        download: async (link) => {

            if (!link) {
                throw new Error('حط لينك 🗿');
            }

            try {
                new URL(link);
            } catch {
                throw new Error('لينك غلط 🗿');
            }

            const response = await axios.get(ytdown.api, {
                params: { url: link },
                timeout: 60000,
                validateStatus: () => true
            });

            if (response.status < 200 || response.status >= 300) {
                console.log('EMAM-API STATUS:', response.status);
                console.log('EMAM-API RESPONSE:', response.data);

                throw new Error(`EMAM-API HTTP ${response.status}`);
            }

            const data = response.data;

            const medias = Array.isArray(data?.medias) ? data.medias : [];

            const audioFormats = medias.filter(
                m => m.type === 'audio' || m.is_audio === true
            );

            if (!audioFormats.length) {
                console.log('EMAM-API RESPONSE:', JSON.stringify(data, null, 2));
                throw new Error('لم يتم العثور على Audio داخل الرد');
            }

            // فضّل m4a بجودة 130kb/s، لو مش موجود خد أول صيغة صوت متاحة
            const selectedAudio =
                audioFormats.find(
                    m => m.ext === 'm4a' && String(m.quality || '').includes('130')
                ) ||
                audioFormats.find(m => m.ext === 'm4a') ||
                audioFormats[0];

            return {
                title: data.title || null,
                thumbnail: data.thumbnail || null,
                duration: data.duration || null,
                audio: {
                    url: selectedAudio.url,
                    ext: selectedAudio.ext,
                    quality: selectedAudio.quality || selectedAudio.label,
                    bitrate: selectedAudio.bitrate || null
                }
            };
        }
    };

    app.get('/api/play-v2', async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                creator: 'TERBO-SPAM',
                error: 'Query is required'
            });
        }

        try {

            const ytResults = await yts.search(q);
            const firstVideo = ytResults.videos?.[0];

            if (!firstVideo) {
                return res.status(404).json({
                    status: false,
                    creator: 'TERBO-SPAM',
                    error: 'No results found'
                });
            }

            const result = await ytdown.download(firstVideo.url);

            return res.status(200).json({
                status: true,
                creator: 'TERBO-SPAM',
                data: {
                    title: result.title || firstVideo.title || null,
                    thumbnail: result.thumbnail || firstVideo.thumbnail || null,
                    duration: result.duration ?? firstVideo.seconds ?? null
                },
                audio: result.audio
            });

        } catch (error) {

            console.error('YT PLAY ERROR:', error.response?.data || error.message);

            return res.status(500).json({
                status: false,
                creator: 'TERBO-SPAM',
                error: error.message
            });
        }
    });
};
