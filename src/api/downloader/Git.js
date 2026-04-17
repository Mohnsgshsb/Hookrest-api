const axios = require('axios');

module.exports = function (app) {

    app.get('/api/spotify', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "url" مطلوب.'
            });
        }

        try {
            const response = await axios.post(
                'https://spotify.downloaderize.com/wp-admin/admin-ajax.php',
                new URLSearchParams({
                    action: 'spotify_downloader_get_info',
                    url: url,
                    nonce: 'd329e2e788'
                }),
                {
                    headers: {
                        "accept": "application/json, text/javascript, */*; q=0.01",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "origin": "https://spotify.downloaderize.com",
                        "referer": "https://spotify.downloaderize.com/",
                        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
                        "x-requested-with": "XMLHttpRequest"
                    }
                }
            );

            res.json({
                status: true,
                result: response.data
            });

        } catch (err) {
            if (err.response) {
                return res.status(err.response.status).json({
                    status: false,
                    error: 'Spotify API error',
                    message: err.response.data
                });
            }

            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
