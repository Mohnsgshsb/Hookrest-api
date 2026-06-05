const axios = require("axios");

module.exports = function (app) {

    function cleanFilename(filename = "") {
        return filename
            .replace(/[<>:"/\\|?*]/g, "_")
            .replace(/-/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 🔎 البحث في SoundCloud
    async function searchSoundCloud(query) {
        try {
            const { data } = await axios.get(
                "https://api-mobi.soundcloud.com/search",
                {
                    params: {
                        q: query,
                        client_id: "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M",
                        stage: ""
                    },
                    headers: {
                        Accept: "application/json, text/javascript, */*; q=0.1",
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/128",
                        Referer: `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`
                    },
                    timeout: 30000
                }
            );

            return (data?.collection || []).map(item => ({
                title: cleanFilename(item.permalink),
                genre: item.genre,
                duration: item.duration,
                artwork: item.artwork_url,
                url: item.permalink_url,
                plays: item.playback_count,
                comments: item.comment_count,
                created_at: item.created_at
            }));

        } catch (e) {
            return [];
        }
    }

    // ⬇️ تحميل من SoundCloud
    async function downloadSoundCloud(url) {
        const { data } = await axios.post(
            "https://snapfrom.com/wp-json/aio-dl/video-data/",
            new URLSearchParams({
                url: url,
                token: "1f91c03707528fc9d3e507fadcf4c5bdd75e9ed776306422bb64fa76559ed3c8"
            }),
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    origin: "https://snapfrom.com",
                    referer: "https://snapfrom.com/soundcloud-music-downloader/",
                    "user-agent":
                        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/139"
                }
            }
        );

        return data;
    }

    // 🚀 API واحد: بحث + تحميل أول نتيجة تلقائي
    app.get("/api/sound", async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: false,
                    error: "query required"
                });
            }

            // 1- البحث
            const results = await searchSoundCloud(query);

            if (!results.length) {
                return res.status(404).json({
                    status: false,
                    error: "No results found"
                });
            }

            // 2- أول نتيجة
            const first = results[0];

            // 3- تحميل مباشر
            const download = await downloadSoundCloud(first.url);

            return res.json({
                status: true,
                query,
                selected: first,
                download
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
