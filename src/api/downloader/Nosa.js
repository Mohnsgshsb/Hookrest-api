const axios = require("axios");
const { Buffer } = require("buffer");

module.exports = function (app) {

    function convert(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (Number(seconds) < 10 ? "0" : "") + seconds;
    }

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
                : { status: false, msg: "Can't generate token!" };

        } catch (e) {
            return { status: false, msg: e.message };
        }
    }

    async function searchSpotify(query, type = "track", limit = 20) {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return [];

            const response = await axios.get(
                "https://api.spotify.com/v1/search",
                {
                    headers: {
                        Authorization: `Bearer ${creds.access_token}`,
                    },
                    params: {
                        q: query,
                        type,
                        limit: Math.min(limit, 50),
                        market: "US",
                    },
                    timeout: 30000,
                }
            );

            const tracks = response.data.tracks.items;

            if (!tracks.length) return [];

            return tracks.map(item => ({
                track_url: item.external_urls.spotify,
                thumbnail: item.album.images[0]?.url || "No thumbnail available",
                title: `${item.artists[0].name} - ${item.name}`,
                artist: item.artists[0].name,
                duration: convert(item.duration_ms),
                preview_url: item.preview_url || "No preview available",
                album: item.album.name,
                release_date: item.album.release_date,
            }));

        } catch (e) {
            return [];
        }
    }

    // 🔥 GET API
    app.all("/api/s/spotify", async (req, res) => {

        const query = req.query.query || req.body.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                message: "Query required",
            });
        }

        try {
            const result = await searchSpotify(query.trim());

            if (!result.length) {
                return res.status(404).json({
                    status: false,
                    message: "No tracks found",
                });
            }

            return res.json({
                status: true,
                total: result.length,
                data: result,
            });

        } catch (e) {
            return res.status(500).json({
                status: false,
                error: e.message,
            });
        }
    });

};
