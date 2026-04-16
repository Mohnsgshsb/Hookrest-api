const axios = require("axios");

module.exports = function (app) {

    const base = "https://www.pinterest.com";
    const search = "/resource/BaseSearchResource/get/";

    const headers = {
        'accept': 'application/json, text/javascript, */*, q=0.01',
        'referer': 'https://www.pinterest.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'x-requested-with': 'XMLHttpRequest'
    };

    // 🔐 جلب كوكيز
    async function getCookies() {
        try {
            const res = await axios.get(base);
            const set = res.headers['set-cookie'];
            if (!set) return null;

            return set.map(c => c.split(';')[0]).join('; ');
        } catch (e) {
            return null;
        }
    }

    // 🔎 البحث في Pinterest
    async function pinSearch(query, limit = 10) {
        try {
            const cookies = await getCookies();
            if (!cookies) return [];

            const params = {
                source_url: `/search/pins/?q=${query}`,
                data: JSON.stringify({
                    options: {
                        isPrefetch: false,
                        query,
                        scope: "pins",
                        bookmarks: [""],
                        page_size: limit
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const { data } = await axios.get(`${base}${search}`, {
                headers: { ...headers, cookie: cookies },
                params
            });

            const results = data?.resource_response?.data?.results || [];

            const pins = results
                .filter(v => v.images?.orig?.url)
                .map(v => ({
                    id: v.id,
                    title: v.title || "بدون عنوان",
                    description: v.description || "بدون وصف",
                    url: `https://pinterest.com/pin/${v.id}`,
                    image: v.images.orig.url,
                    uploader: {
                        username: v.pinner?.username,
                        name: v.pinner?.full_name
                    }
                }));

            return pins;

        } catch (e) {
            console.error("Pinterest Error:", e.message);
            return [];
        }
    }

    // 🔥 API ROUTE
    app.all("/api/pinterest", async (req, res) => {

        const text = req.query.text || req.body.text;

        if (!text) {
            return res.status(400).json({
                status: false,
                message: "📌 حط نص البحث"
            });
        }

        try {
            const results = await pinSearch(text, 10);

            if (!results.length) {
                return res.status(404).json({
                    status: false,
                    message: `❌ مفيش نتائج لـ: ${text}`
                });
            }

            res.json({
                status: true,
                query: text,
                total: results.length,
                pins: results,
                message: "✅ تم جلب النتائج"
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};
