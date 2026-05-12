const axios = require("axios");

module.exports = function (app) {

    // ================= SAVEWEB2ZIP =================

    async function saveweb2zip(url, options = {}) {

        if (!url)
            throw new Error("URL is required");

        url = url.startsWith("https://")
            ? url
            : `https://${url}`;

        const {
            renameAssets = false,
            saveStructure = false,
            alternativeAlgorithm = false,
            mobileVersion = false
        } = options;

        // بدء النسخ
        const { data } = await axios.post(
            "https://copier.saveweb2zip.com/api/copySite",
            {
                url,
                renameAssets,
                saveStructure,
                alternativeAlgorithm,
                mobileVersion
            },
            {
                headers: {
                    accept: "*/*",
                    "content-type": "application/json",
                    origin: "https://saveweb2zip.com",
                    referer: "https://saveweb2zip.com/",
                    "user-agent":
                        "Mozilla/5.0 (Linux; Android 10)"
                },
                timeout: 30000
            }
        );

        // انتظار انتهاء التحويل
        while (true) {

            const { data: process } = await axios.get(
                `https://copier.saveweb2zip.com/api/getStatus/${data.md5}`,
                {
                    headers: {
                        accept: "*/*",
                        "content-type": "application/json",
                        origin: "https://saveweb2zip.com",
                        referer: "https://saveweb2zip.com/",
                        "user-agent":
                            "Mozilla/5.0 (Linux; Android 10)"
                    },
                    timeout: 30000
                }
            );

            if (process.isFinished) {

                return {
                    url,
                    copiedFilesAmount:
                        process.copiedFilesAmount,

                    error: {
                        text: process.errorText,
                        code: process.errorCode
                    },

                    downloadUrl:
                        `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}`
                };
            }

            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );
        }
    }

    // ================= API =================

    app.get("/api/savezip", async (req, res) => {

        const { url } = req.query;

        if (!url) {

            return res.status(400).json({
                status: false,
                error: "حط url"
            });
        }

        try {

            const result = await saveweb2zip(
                url,
                {
                    renameAssets: true
                }
            );

            if (result.error.code !== 0) {

                return res.status(500).json({
                    status: false,
                    error:
                        result.error.text ||
                        "فشل التحويل"
                });
            }

            res.json({
                status: true,
                result: {
                    website: result.url,
                    files:
                        result.copiedFilesAmount,

                    zip:
                        result.downloadUrl
                }
            });

        } catch (err) {

            console.log(err);

            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
