const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

module.exports = function (app) {

  const HEADERS = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36",
  };

  function getPostId(url) {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function encodeGraphql(shortcode) {
    const data = {
      variables: JSON.stringify({
        shortcode,
        fetch_comment_count: null,
        fetch_related_profile_media_count: null,
        parent_comment_count: null,
        child_comment_count: null,
        fetch_like_count: null,
        fetch_tagged_user_count: null,
        fetch_preview_comment_count: null,
        has_threaded_comments: false,
      }),
      doc_id: "10015901848480474",
    };

    return qs.stringify(data);
  }

  async function getGraphQL(url) {
    const shortcode = getPostId(url);
    if (!shortcode) throw new Error("Invalid URL");

    const res = await axios.post(
      "https://www.instagram.com/api/graphql",
      encodeGraphql(shortcode),
      { headers: HEADERS }
    );

    const media = res.data?.data?.xdt_shortcode_media;
    if (!media) throw new Error("No media");

    const urls = media.edge_sidecar_to_children
      ? media.edge_sidecar_to_children.edges.map(
          (e) => e.node.video_url || e.node.display_url
        )
      : [media.video_url || media.display_url];

    return {
      url: urls,
      metadata: {
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || "",
        username: media.owner?.username,
        like: media.edge_media_preview_like?.count || 0,
        comment: media.edge_media_to_comment?.count || 0,
        isVideo: media.is_video,
      },
    };
  }

  async function getSnapSave(url) {
    const res = await axios.post(
      "https://snapsave.app/action.php?lang=id",
      "url=" + url,
      { headers: HEADERS }
    );

    const $ = cheerio.load(res.data);

    const links = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("http")) links.push(href);
    });

    if (!links.length) throw new Error("No SnapSave result");

    return {
      url: links,
      metadata: { source: url },
    };
  }

  async function Instagram(url) {
    try {
      return await getGraphQL(url);
    } catch (e) {
      try {
        return await getSnapSave(url);
      } catch (e2) {
        return { url: null, metadata: null };
      }
    }
  }

  // ================= API =================
  app.get("/api/nosa", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "حط رابط انستجرام",
      });
    }

    try {
      const result = await Instagram(url);

      if (!result.url) {
        return res.json({
          status: false,
          creator: "TERBO-SPAM",
          message: "No media found",
          result,
        });
      }

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  });
};
