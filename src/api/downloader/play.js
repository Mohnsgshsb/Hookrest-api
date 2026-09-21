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

            const response = await axios.post(
                ytdown.api,
                body,
                {
                    headers: ytdown.headers,
                    timeout: 60000,
                    decompress: true,
                    responseType: 'json',
                    validateStatus: () => true
                }
            );

            if (response.status < 200 || response.status >= 300) {
                console.log('VIDSAVE STATUS:', response.status);
                console.log('VIDSAVE RESPONSE:', response.data);

                throw new Error(
                    `VidSave HTTP ${response.status}`
                );
            }

            const data = response.data;

            const allFormats = [];

            const addFormat = (item) => {

                if (!item || typeof item !== 'object') {
                    return;
                }

                if (
                    item.type ||
                    item.format ||
                    item.resource_id ||
                    item.resource_content ||
                    item.download_url
                ) {
                    allFormats.push(item);
                }
            };

            const scan = (obj) => {

                if (!obj) {
                    return;
                }

                if (Array.isArray(obj)) {

                    for (const item of obj) {
                        addFormat(item);
                        scan(item);
                    }

                    return;
                }

                if (typeof obj !== 'object') {
                    return;
                }

                if (Array.isArray(obj.available_formats)) {

                    for (const item of obj.available_formats) {
                        addFormat(item);
                    }
                }

                for (const key of Object.keys(obj)) {

                    if (key === 'available_formats') {
                        continue;
                    }

                    const value = obj[key];

                    if (
                        value &&
                        typeof value === 'object'
                    ) {
                        scan(value);
                    }
                }
            };

            scan(data);

            const uniqueFormats = Array.from(
                new Map(
                    allFormats.map((item, index) => [
                        item.resource_id ||
                        item.download_url ||
                        item.resource_content ||
                        `${item.type}-${item.format}-${item.quality}-${index}`,

                        item
                    ])
                ).values()
            );

            const audioFormats = uniqueFormats.filter(
                item =>
                    String(item.type || '').toLowerCase() === 'audio'
            );

            const mp3Formats = audioFormats.filter(
                item =>
                    String(item.format || '').toUpperCase() === 'MP3'
            );

            const selectedAudio =
                mp3Formats.find(
                    item =>
                        String(item.quality || '').toUpperCase() === '48KBPS'
                ) ||
                mp3Formats[0] ||
                audioFormats[0] ||
                null;

            if (!selectedAudio) {

                console.log(
                    'VIDSAVE RESPONSE:',
                    JSON.stringify(data, null, 2)
                );

                throw new Error(
                    'لم يتم العثور على Audio داخل VidSave'
                );
            }

            const videoData =
                data?.data ||
                data?.result ||
                {};

            return {
                id: videoData.id || null,
                title: videoData.title || null,
                thumbnail: videoData.thumbnail || null,
                duration: videoData.duration || null,

                selected_format: selectedAudio,

                formats: uniqueFormats
            };
        }
    };

    app.get('/api/p', async (req, res) => {

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

            const firstVideo =
                ytResults.videos?.[0];

            if (!firstVideo) {
                return res.status(404).json({
                    status: false,
                    creator: 'TERBO-SPAM',
                    error: 'No results found'
                });
            }

            const result =
                await ytdown.download(firstVideo.url);

            return res.status(200).json({

                status: true,

                creator: 'TERBO-SPAM',

                data: {
                    id:
                        result.id ||
                        firstVideo.videoId ||
                        null,

                    title:
                        result.title ||
                        firstVideo.title ||
                        null,

                    thumbnail:
                        result.thumbnail ||
                        firstVideo.thumbnail ||
                        null,

                    duration:
                        result.duration ??
                        firstVideo.seconds ??
                        null
                },

                video: {
                    title:
                        firstVideo.title || null,

                    channel:
                        firstVideo.author?.name || null,

                    duration:
                        firstVideo.duration?.timestamp || null,

                    imageUrl:
                        firstVideo.thumbnail || null,

                    link:
                        firstVideo.url || null
                },

                download: result.selected_format,

                formats: result.formats

            });

        } catch (error) {

            console.error(
                'YT PLAY ERROR:',
                error.response?.data ||
                error.message
            );

            return res.status(500).json({

                status: false,

                creator: 'TERBO-SPAM',

                error:
                    error.message

            });
        }
    });
};
