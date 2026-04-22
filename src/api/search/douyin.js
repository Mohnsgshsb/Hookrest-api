const express = require("express");
const axios = require("axios");

module.exports = function (app) {

  app.get("/api/akinator/answer", async (req, res) => {
    try {
      const {
        answer,
        step,
        progression,
        session,
        signature,
        cookies
      } = req.query;

      // تحقق
      if (
        answer === undefined ||
        step === undefined ||
        progression === undefined ||
        !session ||
        !signature ||
        !cookies
      ) {
        return res.json({
          status: false,
          creator: "TERBO-SPAM",
          message: "❌ ناقص بيانات"
        });
      }

      // تجهيز body زي الموقع
      const body = new URLSearchParams({
        step: step,
        progression: progression,
        sid: "1",
        cm: "false",
        answer: answer,
        step_last_proposition: "",
        session: session,
        signature: signature
      });

      // request
      const response = await axios.post(
        "https://ar.akinator.com/answer",
        body.toString(),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
            "x-requested-with": "XMLHttpRequest",
            origin: "https://ar.akinator.com",
            referer: "https://ar.akinator.com/game",
            cookie: cookies
          }
        }
      );

      const data = response.data;

      // رجع كل حاجة زي ما هي + تنسيقك
      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          completion: data.completion,
          question: data.question,
          question_id: data.question_id,
          step: data.step,
          progression: data.progression,
          trouvitudesReponses: data.trouvitudesReponses
        }
      });

    } catch (err) {
      console.error(err.response?.data || err.message);

      return res.json({
        status: false,
        creator: "TERBO-SPAM",
        error: err.response?.data || err.message
      });
    }
  });

};
