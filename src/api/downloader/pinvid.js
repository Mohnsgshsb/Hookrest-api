const axios = require("axios");

module.exports = function (app) {

    const base = "https://www.pinterest.com";
    const endpoint = "/resource/BaseSearchResource/get/";

    async function getCookies() {
        const res = await axios.get(base);
        const set = res.headers["set-cookie"];
        if (!set) return null;

        return set.map(c => c.split(";")[0]).join("; ");
    }

    async function search(query) {
        const cookies = await getCookies();

        const { data } = await axios.get(base + endpoint, {
            headers: {
                "user-agent": "Mozilla/5.0 (Android)",
                "x-requested-with": "XMLHttpRequest",
                cookie: cookies
            },
            params: {
                source_url: `/search/pins/?q=${query}`,
                data: JSON.stringify({
                    options: {
                        query,
                        scope: "pins",
                        page_size: 10,
                        bookmarks: [""]
                    },
                    context: {}
                }),
                _: Date.now()
            }
        });

        const results = data?.resource_response?.data?.results || [];

        return results
            .filter(v => v.images?.orig?.url)
            .map(v => ({
                title: v.title,
                image: v.images.orig.url,
                url: `https://pinterest.com/pin/${v.id}`
            }));
    }

    app.all("/api/pinterest", async (req, res) => {
        const text = req.query.text || req.body.text;

        if (!text) {
            return res.json({
                status: false,
                message: "send text"
            });
        }

        const result = await search(text);

        if (!result.length) {
            return res.json({
                status: false,
                message: "no results"
            });
        }

        res.json({
            status: true,
            query: text,
            result
        });
    });

};                result: results,
                message: "✅ تم جلب النتائج بنجاح"
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};
