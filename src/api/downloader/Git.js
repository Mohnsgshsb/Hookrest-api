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
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            // استخراج الصور
            const images = [...data.matchAll(/"url":"(https:\/\/i\.pinimg\.com[^"]+)"/g)]
                .map(v => v[1].replace(/\\u002F/g, '/'));

            // حذف التكرار + أول 15
            const unique = [...new Set(images)].slice(0, 15);

            res.json({
                status: true,
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
