const axios = require("axios");

module.exports = function (app) {

  async function tikwm(url) {

    const { data } = await axios.post(
      "https://tikwm.com/api/",
      new URLSearchParams({
        url,
        count: "12",
        cursor: "0",
        web: "1",
        hd: "1"
      }).toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://tikwm.com",
          "Referer": "https://tikwm.com/"
        },
        timeout: 60000
      }
    );

    if (data.code !== 0) {
      throw new Error(data.msg || "فشل استخراج الفيديو");
    }

    const d = data.data;

    const fix = (x) => {
      if (!x) return null;
      return x.startsWith("http")
        ? x
        : `https://tikwm.com${x}`;
    };

    return {
      id: d.id,
      title: d.title,
      region: d.region,
      duration: d.duration,
      created: d.create_time,

      author: {
        id: d.author?.id,
        username: d.author?.unique_id,
        nickname: d.author?.nickname,
        avatar: fix(d.author?.avatar)
      },

      statistics: {
        play: d.play_count,
        likes: d.digg_count,
        comments: d.comment_count,
        shares: d.share_count,
        downloads: d.download_count,
        favorites: d.collect_count
      },

      media: {
        thumbnail: fix(d.cover),

        video: fix(d.play),

        video_hd: fix(d.hdplay),

        video_wm: fix(d.wmplay),

        audio: fix(d.music)
      },

      music: {
        id: d.music_info?.id,
        title: d.music_info?.title,
        author: d.music_info?.author,
        duration: d.music_info?.duration,
        original: d.music_info?.original,
        url: d.music_info?.play
      }
    };

  }

  app.get("/api/tiktok", async (req, res) => {

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "TERBO-SPAM",
        error: "حط رابط تيك توك في ?url="
      });
    }

    try {

      const result = await tikwm(url);

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
        result
      });

    } catch (e) {

      res.status(500).json({
        status: false,
        creator: "TERBO-SPAM",
        error: e.response?.data || e.message
      });

    }

  });

};
