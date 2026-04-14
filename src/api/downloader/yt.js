const axios = require('axios');

module.exports = function (app) {
    const ytdown = {

        api: {
            convert: "https://ssyt.rip/mates/en/convert"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
            'origin': 'https://ssyt.rip',
            'referer': 'https://ssyt.rip/ar/',
        },

        fixedId: "ypwjF/ZPYN5NeeaZmdEUA/fBXBzDBSjjFoE7kvd6crwoqkvR+ytjU400/osXV7ME",

        isUrl: str => {
            try { new URL(str); return true; } catch { return false; }
        },

        request: async (url) => {
            const { data } = await axios.post(
                `${ytdown.api.convert}?id=${encodeURIComponent(ytdown.fixedId)}`,
                new URLSearchParams({
                    'platform': 'youtube',
                    'url': url, // ✅ المتغير الوحيد
                    'title': 'يا عزووو😂🤷🏻‍♂️',
                    'id': ytdown.fixedId,
                    'ext': 'mp3',
                    'note': '128k',
                    'format': '140-drc'
                }),
                {
                    headers: ytdown.headers
                }
            );
            return data;
        },

        download: async (link) => {
            if (!link) throw new Error("حط لينك 🗿");
            if (!ytdown.isUrl(link)) throw new Error("لينك غلط 🗿");

            const res = await ytdown.request(link);
            return ytdown.final(res);
        },

        final: (data) => ({
            success: true,
            result: data
        })
    };

    // 🔥 Endpoint MP3
    app.get('/api/mp', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'حط لينك'
            });
        }

        try {
            const result = await ytdown.download(url);
            res.json({
                status: true,
                creator: 'Mohnd',
                ...result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
