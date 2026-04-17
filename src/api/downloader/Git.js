const axios = require('axios');

module.exports = function (app) {

    app.get('/pinterest', async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: "حط كلمة البحث"
            });
        }

        try {
            const { data } = await axios.get(
                `https://www.pinterest.com/search/pins/?rs=typed&q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                }
            );

            // 🔥 نطلع الصور (HD)
            let images = [...data.matchAll(/"url":"(https:\/\/i\.pinimg\.com\/[^"]+)"/g)]
                .map(v => v[1]
                    .replace(/\\u002F/g, '/')
                    .replace(/236x|474x|564x/g, 'original') // نخليها اعلى جودة
                );

            // ❌ نشيل الصور الصغيرة / الايقونات
            images = images.filter(v => v.includes('pinimg.com') && v.endsWith('.jpg'));

            // ✅ نشيل التكرار + نجيب اول 15
            const unique = [...new Set(images)].slice(0, 15);

            if (!unique.length) {
                return res.status(404).json({
                    status: false,
                    error: "مفيش نتائج"
                });
            }

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                total: unique.length,
                result: unique
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
