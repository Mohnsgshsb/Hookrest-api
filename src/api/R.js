const axios = require("axios")
const cheerio = require("cheerio")

module.exports = function (app) {

    const baseUrl = "https://otakudesu.cloud"
    const proxy = () => null // لو عندك بروكسي عدلها

    // ================= FUNCTION =================
    async function searchAnime(query) {
        try {
            const url = `${baseUrl}/?s=${query}&post_type=anime`

            const { data } = await axios.get((proxy() || "") + url, {
                timeout: 30000
            })

            const $ = cheerio.load(data)
            const animeList = []

            $(".chivsrc li").each((_, el) => {
                animeList.push({
                    title: $(el).find("h2 a").text().trim(),
                    link: $(el).find("h2 a").attr("href"),
                    imageUrl: $(el).find("img").attr("src"),
                    genres: $(el).find(".set").first().text().replace("Genres : ", "").trim(),
                    status: $(el).find(".set").eq(1).text().replace("Status : ", "").trim(),
                    rating: $(el).find(".set").eq(2).text().replace("Rating : ", "").trim() || "N/A"
                })
            })

            return animeList

        } catch (err) {
            console.log("API Error:", err.message)
            throw new Error("فشل في جلب النتائج")
        }
    }

    // ================= GET =================
    app.get("/api/anime/otakudesu/search", async (req, res) => {
        try {
            const { s } = req.query

            if (!s) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب البحث ?s="
                })
            }

            const data = await searchAnime(s.trim())

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                query: s,
                result: data
            })

        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "❌ حصل خطأ",
                error: err.message
            })
        }
    })

    // ================= POST =================
    app.post("/api/anime/otakudesu/search", async (req, res) => {
        try {
            const { s } = req.body

            if (!s) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب البحث في body"
                })
            }

            const data = await searchAnime(s.trim())

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                query: s,
                result: data
            })

        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "❌ حصل خطأ",
                error: err.message
            })
        }
    })

}
