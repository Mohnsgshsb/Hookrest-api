const axios = require('axios');
const yts = require('yt-search');

module.exports = function(app) {

    const vidssave = {
        api: {
            parse: "https://api.vidssave.com/api/contentsite_api/media/parse"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.163 Mobile Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Android WebView";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'origin': 'https://vidssave.com',
            'x-requested-with': 'mark.via.gp',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://vidssave.com/',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'priority': 'u=1, i'
        },

        isUrl: (str) => {
            try { new URL(str); return true; } catch { return false; }
        },

        parse: async (url) => {
            // Build form data
            const params = new URLSearchParams();
            params.append('auth', '20250901majwlqo');
            params.append('domain', 'api-ak.vidssave.com');
            params.append('origin', 'source');
            params.append('link', url);

            const res = await axios.post(
                vidssave.api.parse,
                params.toString(),
                {
                    headers: vidssave.headers,
                    responseType: 'json'
                }
            );

            const data = res.data;

            if (!data || !data.data || !data.data.resources) {
                throw new Error("فشل في جلب بيانات التحميل من vidssave");
            }

            // Find first audio resource
            const audioResources = data.data.resources.filter(r => r.type === 'audio');
            
            if (!audioResources || audioResources.length === 0) {
                throw new Error("مفيش صوت متاح للتحميل 🗿");
            }

            const firstAudio = audioResources[0];

            return {
                success: true,
                title: data.data.title || null,
                duration: data.data.duration || null,
                thumbnail: data.data.thumbnail || null,
                download: firstAudio.download_url || null,
                quality: firstAudio.quality || null,
                format: firstAudio.format || null,
                size: firstAudio.size || null,
                raw: data
            };
        },

        download: async (link) => {
            if (!link) throw new Error("حط لينك 🗿");
            if (!vidssave.isUrl(link)) throw new Error("لينك غلط 🗿");

            const res = await vidssave.parse(link);
            return res;
        }
    };

    // مسار البحث عن الأغنية وتحميلها
    app.get('/api/playx', async (req, res) => {
        const { q } = req.query; // استعلام البحث عن اسم الأغنية
        if (!q) {
            return res.status(400).json({ status: false, error: 'Query is required' });
        }
        try {
            // البحث عن أول فيديو باستخدام yt-search
            const ytResults = await yts.search(q);
            const firstVideo = ytResults.videos[0];
            if (!firstVideo) {
                return res.status(404).json({ status: false, error: 'No results found' });
            }

            const videoUrl = firstVideo.url;

            // تحميل الصوت باستخدام vidssave
            const downloadResult = await vidssave.download(videoUrl);

            // إرجاع النتيجة للمستخدم
            res.status(200).json({
                status: true,
                video: {
                    title: firstVideo.title,
                    channel: firstVideo.author.name,
                    duration: firstVideo.duration.timestamp,
                    imageUrl: firstVideo.thumbnail,
                    link: firstVideo.url
                },
                download: downloadResult
            });

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });

};
