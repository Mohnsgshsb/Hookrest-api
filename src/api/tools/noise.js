const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

module.exports = function (app) {

    const NoiseRemover = {

        async run(buffer) {
            const formData = new FormData();

            formData.append("media", buffer, {
                filename: crypto.randomBytes(4).toString("hex") + ".mp3"
            });

            formData.append("fingerprint", crypto.randomBytes(16).toString("hex"));
            formData.append("mode", "pulse");

            const res = await axios.post(
                "https://noiseremoval.net/wp-content/plugins/audioenhancer/requests/noiseremoval/noiseremovallimited.php",
                formData,
                {
                    timeout: 20000,
                    headers: {
                        ...formData.getHeaders(),
                        "accept": "*/*",
                        "origin": "https://noiseremoval.net",
                        "referer": "https://noiseremoval.net/",
                        "user-agent":
                            "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                        "x-requested-with": "XMLHttpRequest"
                    }
                }
            );

            return res.data;
        }
    };

    app.post("/api/noise-remove", async (req, res) => {
        try {
            const { media } = req.body;
            if (!media) {
                return res.status(400).json({
                    status: false,
                    error: "send media url or base64"
                });
            }

            let buffer;

            if (media.startsWith("data:")) {
                buffer = Buffer.from(media.split(",")[1], "base64");
            } else {
                const file = await axios.get(media, { responseType: "arraybuffer" });
                buffer = Buffer.from(file.data);
            }

            const result = await NoiseRemover.run(buffer);

            return res.json({
                status: true,
                creator: "Mohnd",
                result
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });
};
