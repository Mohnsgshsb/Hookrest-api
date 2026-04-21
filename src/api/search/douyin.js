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

      // تحقق من البيانات
      if (
        answer === undefined ||
        !step ||
        !progression ||
        !session ||
        !signature ||
        !cookies
      ) {
        return res.json({
          status: false,
          creator: "TERBO-SPAM",
          error: "ناقص بيانات"
        });
      }

      const body = new URLSearchParams({
        step,
        progression,
        sid: "1",
        cm: "false",
        answer,
        session,
        signature
      });

      const response = await axios({
        method: "POST",
        url: "https://ar.akinator.com/answer",
        data: body.toString(),
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://ar.akinator.com",
          "Referer": "https://ar.akinator.com/game",
          "Cookie": cookies
        }
      });

      const data = response.data;

      // لو وصل لمرحلة التخمين
      if (data.id_proposition) {
        return res.json({
          status: true,
          creator: "TERBO-SPAM",
          guess: true,
          result: {
            name: data.name_proposition,
            description: data.description_proposition,
            photo: data.photo
          }
        });
      }

      // سؤال عادي
      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          question: data.question,
          step: data.step,
          progression: data.progression
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
