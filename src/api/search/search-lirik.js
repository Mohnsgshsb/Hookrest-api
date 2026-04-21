const axios = require("axios");

module.exports = function (app) {

  app.get("/api/akinator/start", async (req, res) => {
    try {

      const response = await axios({
        method: "POST",
        url: "https://ar.akinator.com/game",
        data: "sid=1&cm=false",
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Content-Type": "application/x-www-form-urlencoded",
          "Origin": "https://ar.akinator.com",
          "Referer": "https://ar.akinator.com/",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = response.data;

      const get = (regex) => {
        const m = html.match(regex);
        return m ? m[1] : null;
      };

      const session = get(/session', '(\d+)'/);
      const signature = get(/signature', '([^']+)'/);
      const question = get(/id="question-label">([^<]+)/);

      const cookies = response.headers["set-cookie"]
        ?.map(c => c.split(";")[0])
        .join("; ");

      if (!session || !signature) {
        return res.json({
          status: false,
          creator: "TERBO-SPAM",
          error: "فشل استخراج البيانات"
        });
      }

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          question,
          step: "0",
          progression: "0",
          session,
          signature,
          cookies
        }
      });

    } catch (err) {
      console.log(err.response?.data || err.message);

      res.status(500).json({
        status: false,
        creator: "TERBO-SPAM",
        error: err.response?.status || err.message
      });
    }
  });

};
