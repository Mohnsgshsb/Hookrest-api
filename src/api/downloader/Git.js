const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://studio-api-prod.suno.com";

    const HEADERS = {
        "User-Agent": "Mozilla/5.0",
        "authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InN1bm8tYXBpLXJzMjU2LWtleS0xIiwidHlwIjoiSldUIn0.eyJzdW5vLmNvbS9jbGFpbXMvdXNlcl9pZCI6ImUyZjNmMmJjLWI0ODUtNDY1Mi1iZDRlLTdmMGI5ZTExNDk5ZSIsImh0dHBzOi8vc3Vuby5haS9jbGFpbXMvY2xlcmtfaWQiOiJ1c2VyXzM0ZmVKQVlLRGNYM1dacUdEamhuODlMVURmQyIsInN1bm8uY29tL2NsYWltcy90b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc2NDYwMTU5LCJhdWQiOiJzdW5vLWFwaSIsInN1YiI6InVzZXJfMzRmZUpBWUtEY1gzV1pxR0RqaG44OUxVRGZDIiwiYXpwIjoiaHR0cHM6Ly9zdW5vLmNvbSIsImZ2YSI6WzAsLTFdLCJpYXQiOjE3NzY0NTY1NTksImlzcyI6Imh0dHBzOi8vYXV0aC5zdW5vLmNvbSIsImppdCI6IjA0YmEwNGJhLTQ4NTQtNGEyZC05OWM2LWIxNWNkNjNlMjU2NyIsInZpeiI6ZmFsc2UsInNpZCI6InNlc3Npb25fZDFjZTk3NGU1NWE5Yzk1ZWNhMjJiYSIsInN1bm8uY29tL2NsYWltcy9lbWFpbCI6Im1vaG5kbW9obmQyNTgwMEBnbWFpbC5jb20iLCJodHRwczovL3N1bm8uYWkvY2xhaW1zL2VtYWlsIjoibW9obmRtb2huZDI1ODAwQGdtYWlsLmNvbSJ9.I6pZW4QaQ0L5d37yMYYV0YtNEuYJQ07tRvQbY5cqOzwnhF7j-iOhN4lcChsMcR9YrLbbPyDn1Cmdx__-W_nPOKUkIcvRRG1i-RD_ObKBus7zNZVA5LOANEB0r1LE1m0yqb6TI2tdhkpwmeBFbkYudvH0ErHgY9Zz1NOumjdmTqi537j9vF3OzWkZs3F4CkSZHJ7oeOiMz97cq1_q8W_Cd04AuL7sDFGzfOEreF-6OxtmcYgqb6YiJMhW7pFq0Ww8EEE_r1UV4b_5uYiOHoqUH-_nNv-H6QYsAUJtHSrF8mfN5WKK2T2fL5TyAffGlL985ZZ205U_IJgmY3Oh2h_QCg",
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
