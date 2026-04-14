const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

module.exports = function (app) {

    // =========================
    // 🔥 INSTAGRAM SCRAPER CORE
    // =========================

    const HEADERS = {
        Accept: "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        origin: "https://snapsave.app",
        referer: "https://snapsave.app/id",
    };

    const getInstagramPostId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const formatShortNumber = (n) => {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
        return String(n);
    };

    // =========================
    // 🔥 SNAPSAVE SCRAPER
    // =========================
    async function getDownloadLinks(url) {
        const response = await axios.post(
            "https://snapsave.app/action.php?lang=id",
            "url=" + url,
            { headers: HEADERS }
        );

        const data = response.data;

        const $ = cheerio.load(data);
        const links = [];

        $("a").each((i, el) => {
            let href = $(el).attr("href");
            if (href && href.includes("http")) links.push(href);
        });

        return links;
    }

    // =========================
    // 🔥 GRAPHQL (fallback)
    // =========================
    async function ig(url) {
        const shortcode = getInstagramPostId(url);
        if (!shortcode) throw new Error("Invalid Instagram URL");

        const query = qs.stringify({
            variables: JSON.stringify({ shortcode }),
            doc_id: "10015901848480474"
        });

        const { data } = await axios.post(
            "https://www.instagram.com/api/graphql",
            query,
            { headers: HEADERS }
        );

        const media = data?.data?.xdt_shortcode_media;

        if (!media) throw new Error("No media found");

        return {
            url: media.edge_sidecar_to_children
                ? media.edge_sidecar_to_children.edges.map(e =>
                    e.node.video_url || e.node.display_url
                )
                : [media.video_url || media.display_url],

            metadata: {
                caption: media.edge_media_to_caption?.edges[0]?.node?.text || "",
                username: media.owner.username,
                like: media.edge_media_preview_like.count,
                comment: media.edge_media_to_comment.count,
                isVideo: media.is_video
            }
        };
    }

    async function Instagram(url) {
        try {
            return await ig(url);
        } catch (e) {
            const links = await getDownloadLinks(url);
            return {
                url: links,
                metadata: {
                    caption: null,
                    username: null,
                    like: 0,
                    comment: 0,
                    isVideo: false
                }
            };
        }
    }

    // =========================
    // 🚀 API ENDPOINT
    // =========================
    app.get("/api/instagram", async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "URL is required"
                });
            }

            if (!url.includes("instagram.com")) {
                return res.status(400).json({
                    status: false,
                    error: "Invalid Instagram URL"
                });
            }

            const result = await Instagram(url);

            res.json({
                status: true,
                creator: "YourBot",
                result: {
                    media: result.url,
                    caption: result.metadata.caption,
                    username: result.metadata.username,
                    like: formatShortNumber(result.metadata.like),
                    comment: formatShortNumber(result.metadata.comment),
                    isVideo: result.metadata.isVideo
                }
            });

        } catch (err) {
            console.error("Instagram API Error:", err.message);
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
