const axios = require("axios");

module.exports = function (app) {

    // 🔎 function البحث
    async function fetchLyrics(title) {
        if (!title) throw new Error("A song title is required.");

        const url = `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`;

        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        return data;
    }

    // 🔥 endpoint
    app.get("/api/lyric", async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب اسم الأغنية ?query="
                });
            }

            const results = await fetchLyrics(query);

            if (!results || results.length === 0) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ مفيش نتايج"
                });
            }

            const song = results[0];

            const lyricsText = song.syncedLyrics || song.plainLyrics;

            if (!lyricsText) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ مفيش كلمات للأغنية"
                });
            }

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                input: query,
                result: {
                    title: song.trackName,
                    artist: song.artistName,
                    album: song.albumName,
                    duration: song.duration,
                    lyrics: lyricsText
                }
            });

        } catch (err) {
            console.error("Lyrics Error:", err);

            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "❌ حصل خطأ",
                error: err.message
            });
        }
    });

};ج
