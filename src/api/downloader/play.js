const axios = require('axios');
const yts = require('yt-search');

module.exports = function (app) {

    const ytdown = {
        api: 'https://api.vidssave.com/api/contentsite_api/media/parse',

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 16; 2409BRN2CY Build/BP2A.250605.031.A3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.202 Mobile Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Not=A?Brand";v="99", "Android WebView";v="151", "Chromium";v="151"',
            'sec-ch-ua-mobile': '?1',
            'origin': 'https://ar.vidssave.com',
            'x-requested-with': 'mark.via.gp',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://ar.vidssave.com/',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'priority': 'u=1, i'
        },

        download: async (link) => {

            if (!link) {
                throw new Error('حط لينك 🗿');
            }

            try {
                new URL(link);
            } catch {
                throw new Error('لينك غلط 🗿');
            }

            const body = new URLSearchParams();

            body.append('auth', '20250901majwlqo');
            body.append('domain', 'api-ak.vidssave.com');
            body.append('origin', 'source');
            body.append('link', link);

            const response = await axios({
                method: 'POST',
                url: ytdown.api,
                headers: ytdown.headers,
                data: body,
                timeout: 60000,
                decompress: true,
                responseType: 'json',
                validateStatus: () => true
            });

            if (response.status !== 200) {
                console.log('VIDSAVE STATUS:', response.status);
                console.log('VIDSAVE DATA:', response.data);

                throw new Error(
                    `VidSave returned HTTP ${response.status}`
                );
            }

            const data = response.data;

            const videoData = data?.data || data?.result || data;

            if (!videoData) {
                throw new Error('VidSave لم يرجع بيانات');
            }

            const formats =
                videoData?.available_formats ||
                data?.available_formats ||
                [];

            const audio = formats.find(
                item =>
                    String(item?.type || '').toLowerCase() === 'audio'
            );

            if (!audio) {
                throw new Error('لم يتم العثور على Audio');
            }

            return {
                success: true,
                id: videoData.id || null,
                title: videoData.title || null,
                thumbnail: videoData.thumbnail || null,
                duration: videoData.duration || null,
                audio: {
                    resource_id: audio.resource_id || null,
                    quality: audio.quality || null,
                    format: audio.format || 'MP3',
                    type: audio.type || 'audio',
                    size: audio.size || null,
                    resource_content: audio.resource_content || null,
                    download_mode: audio.download_mode || '',
                    download_url: audio.download_url || '',
                    original_format: audio.original_format || null,
                    available_formats: audio.available_formats || []
                }
            };
        }
    };

    app.get('/api/play', async (req, res) => {

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
            const firstVideo = ytResults.videos[0];

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

                video: {
                    title: firstVideo.title,
                    channel: firstVideo.author?.name || null,
                    duration: firstVideo.duration?.timestamp || null,
                    imageUrl: firstVideo.thumbnail || null,
                    link: firstVideo.url
                },

                download: result
            });

        } catch (error) {

            console.error(
                'YT PLAY ERROR:',
                error.response?.data || error.message
            );

            return res.status(500).json({
                status: false,
                creator: 'TERBO-SPAM',
                error: error.message
            });
        }
    });

};
