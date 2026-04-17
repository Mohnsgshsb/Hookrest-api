const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://studio-api-prod.suno.com";

    const HEADERS = {
        "User-Agent": "Mozilla/5.0",
        "authorization": "Bearer YOUR_TOKEN_HERE",
        "content-type": "application/json"
    };

    // ⏳ delay
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // 🎵 generate + polling
    async function generateSong(prompt) {

        // 1️⃣ generate
        const gen = await axios.post(
            `${BASE}/api/generate/v2-web/`,
            {
                generation_type: "TEXT",
                mv: "chirp-auk-turbo",
                prompt: "",
                gpt_description_prompt: prompt,
                make_instrumental: false
            },
            { headers: HEADERS }
        );

        const clipIds = gen.data.clips.map(c => c.id);

        // 2️⃣ polling
        for (let i = 0; i < 25; i++) {
            await delay(4000);

            const feed = await axios.post(
                `${BASE}/api/feed/v3`,
                {
                    filters: {
                        ids: {
                            presence: "True",
                            clipIds: clipIds
                        }
                    },
                    limit: clipIds.length
                },
                { headers: HEADERS }
            );

            const done = feed.data.clips.find(c => c.status === "complete");

            if (done) return done;
        }

        return null;
    }

    // 🚀 REST API (DIRECT STREAM)
    app.all("/api/suno/generate", async (req, res) => {

        const prompt = req.query.prompt || req.body.prompt;

        if (!prompt) {
            return res.status(400).json({
                status: false,
                message: "prompt required"
            });
        }

        try {
            const song = await generateSong(prompt);

            if (!song || !song.audio_url) {
                return res.status(500).json({
                    status: false,
                    message: "failed to generate song"
                });
            }

            // 🎧 تحميل مباشر
            const audio = await axios.get(song.audio_url, {
                responseType: "stream"
            });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${song.title || "suno"}.mp3"`
            );

            audio.data.pipe(res);

        } catch (e) {
            console.log(e);
            res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};
