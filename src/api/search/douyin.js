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

      // ───── إرسال الإجابة ─────
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

      // ───── لو خمّن ─────
      if (
        data?.completion === "OK" &&
        data?.parameters?.elements?.length > 0
      ) {
        const guess = data.parameters.elements[0];

        return res.json({
          status: true,
          creator: "TERBO-SPAM",
          result: {
            completion: "WIN",
            name: guess.name,
            description: guess.description
          }
        });
      }

      // ───── fallback ─────
      if (parseFloat(data.progression) >= 80) {
        try {
          const listRes = await axios.post(
            "https://ar.akinator.com/list",
            new URLSearchParams({
              session: session,
              signature: signature,
              step: data.step
            }),
            {
              headers: {
                "content-type": "application/x-www-form-urlencoded",
                cookie: cookies
              }
            }
          );

          const guess = listRes.data?.parameters?.elements?.[0];

          if (guess) {
            return res.json({
              status: true,
              creator: "TERBO-SPAM",
              result: {
                completion: "WIN",
                name: guess.name,
                description: guess.description
              }
            });
          }
        } catch (e) {}
      }

      // ───── باقي الأسئلة ─────
      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          completion: data.completion,
          question: data.question,
          step: data.step,
          progression: data.progression
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
