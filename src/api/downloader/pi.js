import axios from "axios";

const base = "https://www.pinterest.com";
const search = "/resource/BaseSearchResource/get/";

const headers = {
    'accept': 'application/json, text/javascript, */*, q=0.01',
    'referer': 'https://www.pinterest.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-app-version': 'a9522f',
    'x-pinterest-appstate': 'active',
    'x-pinterest-pws-handler': 'www/[username]/[slug].js',
    'x-requested-with': 'XMLHttpRequest'
};

// 🔥 جلب الكوكيز
async function getCookies() {
    try {
        const res = await axios.get(base);
        const set = res.headers["set-cookie"];
        if (!set) return null;

        return set.map(c => c.split(";")[0]).join("; ");
    } catch {
        return null;
    }
}

// 🔥 البحث
async function searchPinterest(query) {

    if (!query) {
        throw new Error("حط كلمة بحث");
    }

    const cookies = await getCookies();
    if (!cookies) {
        throw new Error("فشل جلب الكوكيز");
    }

    const params = {
        source_url: `/search/pins/?q=${query}`,
        data: JSON.stringify({
            options: {
                isPrefetch: false,
                query,
                scope: "pins",
                bookmarks: [""],
                page_size: 10
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

    if (!results.length) {
        throw new Error("مفيش نتائج");
    }

    return results
        .filter(v => v.images?.orig)
        .map(pin => ({
            id: pin.id,
            title: pin.title || "بدون عنوان",
            description: pin.description || "بدون وصف",
            image: pin.images.orig.url,
            pin_url: `https://pinterest.com/pin/${pin.id}`,
            uploader: {
                username: pin.pinner?.username || "",
                full_name: pin.pinner?.full_name || "",
                profile_url: `https://pinterest.com/${pin.pinner?.username || ""}`
            }
        }));
}

// 🚀 API
export default function (app) {

    app.get("/api/pi", async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "حط كلمة بحث"
            });
        }

        try {
            const pins = await searchPinterest(q);

            res.json({
                status: true,
                creator: "Mohnd",
                query: q,
                result: pins
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

}
