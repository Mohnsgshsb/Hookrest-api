const axios = require('axios');

module.exports = function (app) {
    const yt = {
        baseUrl: 'https://ssyt.rip',

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
            'origin': 'https://ssyt.rip',
            'referer': 'https://ssyt.rip/ar/',
        },

        validateFormat(format) {
            const valid = ['mp3']; // تقدر تزود بعدين
            if (!valid.includes(format)) {
                throw Error(`invalid format! available: ${valid.join(', ')}`);
            }
        },

        async convert(url, format = 'mp3') {
            this.validateFormat(format);

            // ⚠️ لازم تجيب id من request تاني (dynamic)
            // حالياً هنستخدم request أولي يطلع id

            const search = await axios.post(
                `${this.baseUrl}/mates/en/analyze/ajax`,
                new URLSearchParams({
                    url
                }),
                { headers: this.headers }
            );

            const data = search.data;

            if (!data || !data.id) {
                throw Error('فشل في جلب ID');
            }

            const id = data.id;

            // 🔥 التحويل
            const { data: convert } = await axios.post(
                `${this.baseUrl}/mates/en/convert?id=${encodeURIComponent(id)}`,
                new URLSearchParams({
                    platform: 'youtube',
                    url: url,
                    title: data.title || 'unknown',
                    id: id,
                    ext: 'mp3',
                    note: '128k',
                    format: '140'
                }),
                { headers: this.headers }
            );

            if (!convert || convert.status !== 'ok') {
                throw Error('فشل التحويل');
            }

            return convert;
        }
    };

    // endpoint
    app.get('/api/ytdl', async (req, res) => {
        const { url, format = 'mp3' } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'حط الرابط',
            });
        }

        try {
            const result = await yt.convert(url, format);

            res.json({
                status: true,
                creator: 'Mohnd',
                result
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });
};
