const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

module.exports = function (app) {

    function cyphereddata(t, r = "cryptoJS") {
        t = t.toString();
        const e = crypto.randomBytes(32);
        const a = crypto.randomBytes(16);
        const i = crypto.pbkdf2Sync(r, e, 999, 32, "sha512");
        const cipher = crypto.createCipheriv("aes-256-cbc", i, a);

        let encrypted = cipher.update(t, "utf8", "base64");
        encrypted += cipher.final("base64");

        return {
            amtext: encrypted,
            slam_ltol: e.toString("hex"),
            iavmol: a.toString("hex")
        };
    }

    const NoiseRemover = {
        async run(buffer) {

            const timestamp = Math.floor(Date.now() / 1000);
            const encryptedData = cyphereddata(timestamp);

            const formData = new FormData();

            formData.append("media", buffer, {
                filename: crypto.randomBytes(3).toString("hex") + "_audio.mp3"
            });

            formData.append("fingerprint", crypto.randomBytes(16).toString("hex"));
            formData.append("mode", "pulse");

            formData.append("amtext", encryptedData.amtext);
            formData.append("iavmol", encryptedData.iavmol);
            formData.append("slam_ltol", encryptedData.slam_ltol);

            const { data } = await axios.post(
                "https://noiseremoval.net/wp-content/plugins/audioenhancer/requests/noiseremoval/noiseremovallimited.php",
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        accept: "*/*",
                        "x-requested-with": "XMLHttpRequest",
                        referer: "https://noiseremoval.net/"
                    }
                }
            );

            return data;
        }
    };

    // =========================
    // API ENDPOINT
    // =========================
    app.post("/api/noise-remove", async (req, res) => {
        try {

            const { media } = req.body;

            if (!media) {
                return res.status(400).json({
                    status: false,
                    error: "حط ملف صوت (base64 أو URL)"
                });
            }

            let buffer;

            // base64
            if (media.startsWith("data:")) {
                buffer = Buffer.from(media.split(",")[1], "base64");
            }

            // url
            else if (media.startsWith("http")) {
                const file = await axios.get(media, { responseType: "arraybuffer" });
                buffer = Buffer.from(file.data);
            }

            else {
                return res.status(400).json({
                    status: false,
                    error: "صيغة غير صحيحة"
                });
            }

            const result = await NoiseRemover.run(buffer);

            if (result.error) {
                return res.status(500).json({
                    status: false,
                    error: result.message || "failed"
                });
            }

            return res.json({
                status: true,
                creator: "Mohnd",
                result: {
                    enhanced: result.media?.enhanced?.uri || null
                }
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
