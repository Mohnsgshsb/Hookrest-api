const axios = require("axios");
const cheerio = require("cheerio");

module.exports = [
  // ================= SEARCH =================
  {
    metode: "GET",
    endpoint: "search",
    async run({ req }) {
      try {
        const { s } = req.query;

        if (!s) {
          return {
            status: false,
            message: "❌ اكتب ?s=naruto"
          };
        }

        const url = `https://otakudesu.cloud/?s=${s}&post_type=anime`;

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const result = [];

        $(".chivsrc li").each((i, el) => {
          result.push({
            title: $(el).find("h2 a").text().trim(),
            link: $(el).find("h2 a").attr("href"),
            image: $(el).find("img").attr("src"),
            genres: $(el).find(".set").first().text().replace("Genres : ", "").trim(),
            status: $(el).find(".set").eq(1).text().replace("Status : ", "").trim(),
            rating: $(el).find(".set").eq(2).text().replace("Rating : ", "").trim() || "N/A"
          });
        });

        return {
          status: true,
          result
        };

      } catch (err) {
        return {
          status: false,
          message: "❌ حصل خطأ",
          error: err.message
        };
      }
    }
  },

  // ================= DETAIL =================
  {
    metode: "GET",
    endpoint: "detail",
    async run({ req }) {
      try {
        const { url } = req.query;

        if (!url) {
          return {
            status: false,
            message: "❌ اكتب ?url="
          };
        }

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const animeInfo = {
          title: $(".fotoanime .infozingle p span b:contains('Judul')").parent().text().replace("Judul: ", "").trim(),
          japaneseTitle: $(".fotoanime .infozingle p span b:contains('Japanese')").parent().text().replace("Japanese: ", "").trim(),
          score: $(".fotoanime .infozingle p span b:contains('Skor')").parent().text().replace("Skor: ", "").trim(),
          producer: $(".fotoanime .infozingle p span b:contains('Produser')").parent().text().replace("Produser: ", "").trim(),
          type: $(".fotoanime .infozingle p span b:contains('Tipe')").parent().text().replace("Tipe: ", "").trim(),
          status: $(".fotoanime .infozingle p span b:contains('Status')").parent().text().replace("Status: ", "").trim(),
          totalEpisodes: $(".fotoanime .infozingle p span b:contains('Total Episode')").parent().text().replace("Total Episode: ", "").trim(),
          duration: $(".fotoanime .infozingle p span b:contains('Durasi')").parent().text().replace("Durasi: ", "").trim(),
          releaseDate: $(".fotoanime .infozingle p span b:contains('Tanggal Rilis')").parent().text().replace("Tanggal Rilis: ", "").trim(),
          studio: $(".fotoanime .infozingle p span b:contains('Studio')").parent().text().replace("Studio: ", "").trim(),
          genres: $(".fotoanime .infozingle p span b:contains('Genre')").parent().text().replace("Genre: ", "").trim(),
          image: $(".fotoanime img").attr("src"),
        };

        const episodes = [];

        $(".episodelist ul li").each((i, el) => {
          episodes.push({
            title: $(el).find("span a").text(),
            link: $(el).find("span a").attr("href"),
            date: $(el).find(".zeebr").text()
          });
        });

        return {
          status: true,
          animeInfo,
          episodes
        };

      } catch (err) {
        return {
          status: false,
          message: "❌ حصل خطأ",
          error: err.message
        };
      }
    }
  },

  // ================= DOWNLOAD =================
  {
    metode: "GET",
    endpoint: "download",
    async run({ req }) {
      try {
        const { url } = req.query;

        if (!url) {
          return {
            status: false,
            message: "❌ اكتب ?url="
          };
        }

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const result = {
          title: $(".download h4").text().trim(),
          downloads: []
        };

        $(".download ul li").each((i, el) => {
          const quality = $(el).find("strong").text().trim();

          $(el).find("a").each((i, a) => {
            result.downloads.push({
              quality,
              link: $(a).attr("href"),
              host: $(a).text().trim()
            });
          });
        });

        return {
          status: true,
          result
        };

      } catch (err) {
        return {
          status: false,
          message: "❌ حصل خطأ",
          error: err.message
        };
      }
    }
  }
];
