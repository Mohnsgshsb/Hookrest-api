const axios = require('axios');

class PinterestScraper {
    constructor() {
        this.baseUrl = "https://id.pinterest.com/resource/BaseSearchResource/get/";
        this.headers = {
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded",
            "user-agent": "Mozilla/5.0",
            "x-requested-with": "XMLHttpRequest"
        };
    }

    async makeRequest(params) {
        try {
            const url = this.baseUrl + "?" + new URLSearchParams(params);

            const { data } = await axios.get(url, {
                headers: this.headers
            });

            return data;
        } catch (e) {
            return null;
        }
    }

    format(results) {
        return results.map(item => {
            let video = null;

            if (item.videos?.video_list) {
                const key = Object.keys(item.videos.video_list)[0];
                video = item.videos.video_list[key]?.url;
            }

            return {
                id: item.id,
                pin: `https://www.pinterest.com/pin/${item.id}`,
                title: item.grid_title || "",
                description: item.description || "",
                image: item.images?.orig?.url || null,
                video,
                type: item.videos ? "video" : "image",
                user: item.pinner?.username || null
            };
        });
    }

    async scrape(query, type = null) {
        const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
            data: JSON.stringify({
                options: {
                    query,
                    scope: "pins",
                    rs: "typed"
                },
                context: {}
            }),
            _: Date.now()
        };

        const res = await this.makeRequest(params);
        if (!res) return [];

        let results = this.format(res.resource_response?.data?.results || []);

        if (type) {
            results = results.filter(v => v.type === type);
        }

        return results.slice(0, 15); // 🔥 اول 15 بس
    }
}

const scraper = new PinterestScraper();

module.exports = function (app) {

    // ✅ GET
    app.get('/pinterest', async (req, res) => {
        const { query, type } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: "حط كلمة البحث"
            });
        }

        if (type && !["image", "video", "gif"].includes(type)) {
            return res.status(400).json({
                status: false,
                error: "type لازم image او video او gif"
            });
        }

        try {
            const result = await scraper.scrape(query, type);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                total: result.length,
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // ✅ POST
    app.post('/pinterest', async (req, res) => {
        const { query, type } = req.body;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: "حط كلمة البحث"
            });
        }

        try {
            const result = await scraper.scrape(query, type);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                total: result.length,
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
