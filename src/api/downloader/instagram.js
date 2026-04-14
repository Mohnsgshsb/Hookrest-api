const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

    const USER_AGENT =
        "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36";

    const COMMON_HEADERS = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ar,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "X-Requested-With": "mark.via.gp",
    };

    function parseCookies(setCookie = []) {
        const jar = {};
        for (const c of setCookie) {
            try {
                const [pair] = c.split(";");
                const i = pair.indexOf("=");
                if (i > 0) {
                    jar[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
                }
            } catch {}
        }
        return jar;
    }

    function mergeJar(dest, src) {
        for (const k in src) dest[k] = src[k];
    }

    function cookieHeader(jar) {
        return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
    }

    async function wait(jobId, jar, tries = 15) {
        for (let i = 0; i < tries; i++) {
            const res = await axios.get(
                `https://instag.com/api/result/?job_id=${encodeURIComponent(jobId)}`,
                {
                    headers: {
                        ...COMMON_HEADERS,
                        Cookie: cookieHeader(jar),
                    },
                }
            );

            if (res.data && res.data.loading !== true) {
                return res.data;
            }

            await new Promise(r => setTimeout(r, 2000));
        }
        return null;
    }

    async function instaDownload(url) {

        const jar = {};

        // 1️⃣ open site
        const home = await axios.get("https://instag.com/", {
            headers: COMMON_HEADERS
        });

        mergeJar(jar, parseCookies(home.headers["set-cookie"] || []));

        // csrf (اختياري)
        let csrf = null;
        const m = String(home.data).match(/csrfmiddlewaretoken["']?\s*value=["']([^"']+)/i);
        if (m) csrf = m[1];
        if (!csrf && jar.csrftoken) csrf = jar.csrftoken;

        const params = new URLSearchParams();
        if (csrf) params.append("csrfmiddlewaretoken", csrf);
        params.append("url", url);

        // 2️⃣ manager
        const manager = await axios.post(
            "https://instag.com/api/manager/",
            params.toString(),
            {
                headers: {
                    ...COMMON_HEADERS,
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: cookieHeader(jar),
                }
            }
        );

        mergeJar(jar, parseCookies(manager.headers["set-cookie"] || []));

        const data = manager.data;
        const jobId =
            data?.job_id ||
            data?.job_ids?.[0]?.job_id ||
            data?.id;

        if (!jobId) throw new Error("job_id not found");

        // 3️⃣ wait result
        const result = await wait(jobId, jar);

        if (!result) throw new Error("no result found");

        let media = null;

        if (result.html) {
            const $ = cheerio.load(result.html);

            media =
                $("a[href*='/proxy-image/']").attr("href") ||
                $("a[href*='/api/image/']").attr("href") ||
                $("a[href^='http']").attr("href");
        }

        if (!media) throw new Error("media not found");

        if (!media.startsWith("http")) {
            media = "https://instag.com" + media;
        }

        return {
            source: url,
            media
        };
    }

    // 🔥 API
    app.get("/api/insta", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك انستجرام"
            });
        }

        try {
            const result = await instaDownload(url);

            res.json({
                status: true,
                creator: "Mohnd",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
