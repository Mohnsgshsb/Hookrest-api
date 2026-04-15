const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

module.exports = function (app) {

    // =========================
    // MAIN SCRAPER FUNCTION
    // =========================
    async function getDownloadLinks(url) {
        return new Promise(async (resolve, reject) => {
            try {

                const response = await axios.post(
                    "https://snapsave.app/action.php?lang=id",
                    "url=" + url,
                    {
                        headers: {
                            accept: "*/*",
                            "content-type": "application/x-www-form-urlencoded",
                            origin: "https://snapsave.app",
                            referer: "https://snapsave.app/id",
                            "user-agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                        }
                    }
                );

                const $ = cheerio.load(response.data);
                const downloadLinks = [];

                $("a").each((_, el) => {
                    const href = $(el).attr("href");
                    if (href && href.startsWith("http")) {
                        downloadLinks.push(href);
                    }
                });

                if (!downloadLinks.length) {
                    return reject(new Error("No data found"));
                }

                return resolve({
                    url: downloadLinks,
                    metadata: {
                        source: url
                    }
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    // =========================
    // GRAPHQL IG SCRAPER
    // =========================
    function getInstagramPostId(url) {
        const regex =
            /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|stories|reel)\/([^/?#&]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    const HEADERS = {
        "User-Agent":
            "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/87 Mobile Safari/537.36"
    };

    async function igGraph(url) {
        const shortcode = getInstagramPostId(url);
        if (!shortcode) throw new Error("Invalid Instagram URL");

        const data = qs.stringify({
            variables: JSON.stringify({
                shortcode,
                fetch_comment_count: true,
                fetch_like_count: true
            }),
            doc_id: "10015901848480474"
        });

        const res = await axios.post(
            "https://www.instagram.com/api/graphql",
            data,
            { headers: HEADERS }
        );

        const media = res.data?.data?.xdt_shortcode_media;

        if (!media) throw new Error("No media found");

        const urls = media.edge_sidecar_to_children
            ? media.edge_sidecar_to_children.edges.map(
                  (e) => e.node.video_url || e.node.display_url
              )
            : [media.video_url || media.display_url];

        return {
            url: urls,
            metadata: {
                caption: media.edge_media_to_caption?.edges?.[0]?.node?.text,
                username: media.owner?.username,
                like: media.edge_media_preview_like?.count,
                comment: media.edge_media_to_comment?.count,
                isVideo: media.is_video
            }
        };
    }

    // =========================
    // MAIN WRAPPER
    // =========================
    async function Instagram(url) {
        try {
            return await igGraph(url);
        } catch (e) {
            return await getDownloadLinks(url);
        }
    }

    // =========================
    // REST API ENDPOINT
    // =========================
    app.get("/api/nosa", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك انستجرام ?url="
            });
        }

        try {
            const result = await Instagram(url);

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
