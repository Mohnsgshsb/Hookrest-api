const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://studio-api-prod.suno.com";

    const headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15)",
        "authorization": `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InN1bm8tYXBpLXJzMjU2LWtleS0xIiwidHlwIjoiSldUIn0.eyJzdW5vLmNvbS9jbGFpbXMvdXNlcl9pZCI6ImUyZjNmMmJjLWI0ODUtNDY1Mi1iZDRlLTdmMGI5ZTExNDk5ZSIsImh0dHBzOi8vc3Vuby5haS9jbGFpbXMvY2xlcmtfaWQiOiJ1c2VyXzM0ZmVKQVlLRGNYM1dacUdEamhuODlMVURmQyIsInN1bm8uY29tL2NsYWltcy90b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc2NDYwMTU5LCJhdWQiOiJzdW5vLWFwaSIsInN1YiI6InVzZXJfMzRmZUpBWUtEY1gzV1pxR0RqaG44OUxVRGZDIiwiYXpwIjoiaHR0cHM6Ly9zdW5vLmNvbSIsImZ2YSI6WzAsLTFdLCJpYXQiOjE3NzY0NTY1NTksImlzcyI6Imh0dHBzOi8vYXV0aC5zdW5vLmNvbSIsImppdCI6IjA0YmEwNGJhLTQ4NTQtNGEyZC05OWM2LWIxNWNkNjNlMjU2NyIsInZpeiI6ZmFsc2UsInNpZCI6InNlc3Npb25fZDFjZTk3NGU1NWE5Yzk1ZWNhMjJiYSIsInN1bm8uY29tL2NsYWltcy9lbWFpbCI6Im1vaG5kbW9obmQyNTgwMEBnbWFpbC5jb20iLCJodHRwczovL3N1bm8uYWkvY2xhaW1zL2VtYWlsIjoibW9obmRtb2huZDI1ODAwQGdtYWlsLmNvbSJ9.I6pZW4QaQ0L5d37yMYYV0YtNEuYJQ07tRvQbY5cqOzwnhF7j-iOhN4lcChsMcR9YrLbbPyDn1Cmdx__-W_nPOKUkIcvRRG1i-RD_ObKBus7zNZVA5LOANEB0r1LE1m0yqb6TI2tdhkpwmeBFbkYudvH0ErHgY9Zz1NOumjdmTqi537j9vF3OzWkZs3F4CkSZHJ7oeOiMz97cq1_q8W_Cd04AuL7sDFGzfOEreF-6OxtmcYgqb6YiJMhW7pFq0Ww8EEE_r1UV4b_5uYiOHoqUH-_nNv-H6QYsAUJtHSrF8mfN5WKK2T2fL5TyAffGlL985ZZ205U_IJgmY3Oh2h_QCg`,
        "origin": "https://suno.com",
        "referer": "https://suno.com/",
        "content-type": "application/json"
    };

    // ⏳ انتظار لحد ما الأغنية تجهز
    async function waitForSong(clipId, maxTry = 30) {

        for (let i = 0; i < maxTry; i++) {

            const { data } = await axios.get(
                `${BASE}/api/feed/?ids=${clipId}`,
                { headers }
            );

            const song = data?.[0];

            if (song?.status === "complete" && song?.audio_url) {
                return song;
            }

            await new Promise(r => setTimeout(r, 5000));
        }

        throw new Error("Timeout: song not ready");
    }

    // 🎵 Generate + Auto Download
    app.post("/api/suno/auto", async (req, res) => {

        try {
            const prompt = req.body.prompt;

            if (!prompt) {
                return res.status(400).json({
                    status: false,
                    message: "prompt required"
                });
            }

            // 1️⃣ إنشاء الأغنية
            const gen = await axios.post(
                `${BASE}/api/generate/v2-web/`,
                {
                    token: null,
                    generation_type: "TEXT",
                    mv: "chirp-auk-turbo",
                    prompt: "",
                    gpt_description_prompt: prompt,
                    make_instrumental: false,
                    metadata: {
                        create_mode: "simple"
                    }
                },
                { headers }
            );

            const clipId = gen.data?.clips?.[0]?.id;

            if (!clipId) {
                return res.status(500).json({
                    status: false,
                    message: "failed to create song"
                });
            }

            // 2️⃣ انتظار لحد ما تجهز
            const song = await waitForSong(clipId);

            if (!song?.audio_url) {
                return res.status(500).json({
                    status: false,
                    message: "audio not found"
                });
            }

            // 3️⃣ تحميل مباشر
            const audio = await axios.get(song.audio_url, {
                responseType: "stream"
            });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="suno.mp3"`
            );

            audio.data.pipe(res);

        } catch (e) {
            res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};
