const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

    app.get('/likee', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'حط رابط Likee'
            });
        }

        try {
            const { data } = await axios.post(
                'https://likeedownloader.com/process',
                new URLSearchParams({
                    id: url,
                    locale: 'ar'
                }),
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'content-type': 'application/x-www-form-urlencoded',
                        'x-requested-with': 'XMLHttpRequest',
                        'origin': 'https://likeedownloader.com',
                        'referer': 'https://likeedownloader.com/ar'
                    }
                }
            );

            const $ = cheerio.load(data.template);

            const video = $('.without_watermark').attr('href');

            if (!video) {
                return res.json({
                    status: false,
                    error: 'فشل استخراج الفيديو'
                });
            }

            res.json({
                status: true,
                video
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
