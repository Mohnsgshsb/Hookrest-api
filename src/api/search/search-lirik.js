const express = require("express");
const axios = require("axios");

module.exports = function (app) {

  app.get("/api/akinator/start", async (req, res) => {
    try {

      // 🔥 أول ريكوست لبدء اللعبة
      const response = await axios.post(
        "https://ar.akinator.com/game",
        new URLSearchParams({
          sid: "1",
          cm: "false"
        }),
        {
          headers: {
            "user-agent": "Mozilla/5.0",
            "content-type": "application/x-www-form-urlencoded"
          }
        }
      );

      const html = response.data;

      // 🔥 استخراج البيانات من الصفحة
      const session = html.match(/session',\s*'([^']+)'/)?.[1];
      const signature = html.match(/signature',\s*'([^']+)'/)?.[1];
      const question = html.match(/id="question-label">([^<]+)/)?.[1];

      const cookies = response.headers["set-cookie"]
        ?.map(c => c.split(";")[0])
        .join("; ");

      if (!session || !signature || !question) {
        return res.json({
          status: false,
          error: "❌ فشل استخراج البيانات"
        });
      }

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          question,
          session,
          signature,
          step: "0",
          progression: "0",
          cookies
        }
      });

    } catch (err) {
      console.error("START ERROR:", err.message);

      res.json({
        status: false,
        error: err.message
      });
    }
  });

};
