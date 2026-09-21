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

        isUrl: (str) => {
            try {
                new URL(str);
                return true;
            } catch {
                return false;
            }
        },

        download: async (link) => {

            if (!link) {
                throw new Error('حط لينك 🗿');
            }

            if (!ytdown.isUrl(link)) {
                throw new Error('لينك غلط 🗿');
            }

            /*
             * نفس:
             * --data-urlencode
             * الموجودة في curl
             */
            const params = new URLSearchParams();

            params.append(
                'auth',
                '20250901majwlqo'
            );

            params.append(
                'domain',
                'api-ak.vidssave.com'
            );

            params.append(
                'origin',
                'source'
            );

            params.append(
                'link',
                link
            );

            /*
             * POST مطابق للـ curl
             */
            const response = await axios.post(
                ytdown.api,
                params.toString(),
                {
                    headers: ytdown.headers,
                    timeout: 60000,

                    // axios يفك gzip/br تلقائياً
                    decompress: true,

                    validateStatus: () => true
                }
            );

            console.log(
                'VIDSAVE STATUS:',
                response.status
            );

            console.log(
                'VIDSAVE RESPONSE:',
                JSON.stringify(
                    response.data,
                    null,
                    2
                )
            );

            if (response.status < 200 || response.status >= 300) {
                throw new Error(
                    `VidSave HTTP ${response.status}`
                );
            }

            const data = response.data;

            /*
             * البيانات الأساسية
             */
            const videoData =
                data?.data ||
                data?.result ||
                data;

            if (!videoData) {
                throw new Error(
                    'VidSave لم يرجع بيانات'
                );
            }

            /*
             * available_formats
             */
            const formats =
                videoData?.available_formats ||
                data?.available_formats ||
                [];

            /*
             * البحث عن الصوت MP3
             */
            const audio =
                formats.find(item =>
                    String(
                        item?.type || ''
                    ).toLowerCase() === 'audio'
                ) || null;

            if (!audio) {
                throw new Error(
                    'لم يتم العثور على Audio داخل available_formats'
                );
            }

            return {
                success: true,

                id:
                    videoData.id || null,

                title:
                    videoData.title || null,

                thumbnail:
                    videoData.thumbnail || null,

                duration:
                    videoData.duration || null,

                audio: {
                    resource_id:
                        audio.resource_id || null,

                    quality:
                        audio.quality || null,

                    format:
                        audio.format || 'MP3',

                    type:
                        audio.type || 'audio',

                    size:
                        audio.size || null,

                    resource_content:
                        audio.resource_content || null,

                    download_mode:
                        audio.download_mode || '',

                    download_url:
                        audio.download_url || '',

                    original_format:
                        audio.original_format || null
                }
            };
        }
    };


    // ================================
    // /api/play
    // ================================

    app.get('/api/play', async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Query is required'
            });
        }

        try {

            /*
             * البحث في YouTube
             */
            const ytResults =
                await yts.search(q);

            const firstVideo =
                ytResults.videos[0];

            if (!firstVideo) {
                return res.status(404).json({
                    status: false,
                    error: 'No results found'
                });
            }

            /*
             * رابط الفيديو
             */
            const videoUrl =
                firstVideo.url;

            /*
             * إرسال الرابط إلى VidSave
             */
            const downloadResult =
                await ytdown.download(
                    videoUrl
                );

            /*
             * الرد
             */
            return res.status(200).json({

                status: true,

                video: {
                    title:
                        firstVideo.title,

                    channel:
                        firstVideo.author?.name ||
                        null,

                    duration:
                        firstVideo.duration?.timestamp ||
                        null,

                    imageUrl:
                        firstVideo.thumbnail,

                    link:
                        firstVideo.url
                },

                download:
                    downloadResult

            });

        } catch (error) {

            console.error(
                'YT PLAY ERROR:',
                error.response?.data ||
                error.message
            );

            return res.status(500).json({

                status: false,

                error:
                    typeof error.response?.data === 'object'
                        ? error.response.data
                        : error.message

            });
        }
    });

};
