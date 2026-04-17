const axios = require("axios");
const Buffer = require("buffer").Buffer;

module.exports = function (app) {

    // ⏱️ تحويل المدة
    function convert(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (Number(seconds) < 10 ? "0" : "") + seconds;
    }

    // 🔐 جلب توكن سبوتيفاي
    async function spotifyCreds() {
        try {
            const response = await axios.post(
                "https://accounts.spotify.com/api/token",
                "grant_type=client_credentials",
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization:
                            "Basic " +
                            Buffer.from(
                                "7bbae52593da45c69a27c853cc22edff:88ae1f7587384f3f83f62a279e7f87af"
                            ).toString("base64"),
                    },
                    timeout: 30000,
                }
            );

            return response.data.access_token
                ? { status: true, access_token: response.data.access_token }
                : { status: false, msg: "Can't generate token" };

        } catch (e) {
            return { status: false, msg: e.message };
        }
    }

    // 🔎 البحث في Spotify
    async function searchSpotify(query, limit = 20) {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return [];

            const { data } = await axios.get(
                "https://api.spotify.com/v1/search",
                {
                    headers: {
                        Authorization: `Bearer ${creds.access_token}`
                    },
                    params: {
                        q: query,
                        type: "track",
                        limit: Math.min(limit, 50),
                        market: "US"
                    },
                    timeout: 30000
                }
            );

            const tracks = data?.tracks?.items || [];

            return tracks.map(item => ({
                track_url: item.external_urls.spotify,
                thumbnail: item.album.images?.[0]?.url || null,
                title: `${item.artists?.[0]?.name} - ${item.name}`,
                artist: item.artists?.[0]?.name,
                duration: convert(item.duration_ms),
                preview_url: item.preview_url || null,
                album: item.album.name,
                release_date: item.album.release_date
            }));

        } catch (e) {
            console.error("Spotify Error:", e.message);
            return [];
        }
    }

    // 🔥 REST API
    app.all("/api/s/spotify", async (req, res) => {

        const query = req.query.query || req.body.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                message: "📌 حط كلمة البحث"
            });
        }

        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                status: false,
                message: "❌ query لازم يكون نص"
            });
        }

        try {
            const result = await searchSpotify(query.trim(), 20);

            if (!result.length) {
                return res.status(404).json({
                    status: false,
                    message: `❌ مفيش نتائج لـ: ${query}`
                });
            }

            return res.json({
                status: true,
                query,
                total: result.length,
                data: result,
                message: "✅ تم جلب النتائج"
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message: "⚠️ Server Error",
                error: err.message
            });
        }
    });

};
