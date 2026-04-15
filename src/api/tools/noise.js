const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

module.exports = function (app) {

  function cyphereddata(t, r = "cryptoJS") {
    t = t.toString();

    const e = crypto.randomBytes(32);
    const a = crypto.randomBytes(16);
    const i = crypto.pbkdf2Sync(r, e, 999, 32, "sha512");

    const cipher = crypto.createCipheriv("aes-256-cbc", i, a);

    let encrypted = cipher.update(t, "utf8", "base64");
    encrypted += cipher.final("base64");

    return JSON.stringify({
      amtext: encrypted,
      slam_ltol: e.toString("hex"),
      iavmol: a.toString("hex")
    });
  }

  const NoiseRemover = {
    async run(buffer) {
      const timestamp = Math.floor(Date.now() / 1000);
      const encryptedData = JSON.parse(cyphereddata(timestamp));

      const formData = new FormData();

      formData.append(
        "media",
        buffer,
        {
          filename: crypto.randomBytes(3).toString("hex") + "_audio.mp3"
        }
      );

      formData.append("fingerprint", crypto.randomBytes(16).toString("hex"));
      formData.append("mode", "pulse");
      formData.append("amtext", encryptedData.amtext);
      formData.append("iavmol", encryptedData.iavmol);
      formData.append("slam_ltol", encryptedData.slam_ltol);

      const response = await axios.post(
        "https://noiseremoval.net/wp-content/plugins/audioenhancer/requests/noiseremoval/noiseremovallimited.php",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            accept: "*/*",
            "x-requested-with": "XMLHttpRequest",
            referer: "https://noiseremoval.net/"
          }
        }
      );

      return response.data;
    }
  };

  // =========================
  // REST API ENDPOINT
  // =========================

  app.post("/api/noise", async (req, res) => {
    try {
      const { audio } = req.body;

      if (!audio) {
        return res.status(400).json({
          status: false,
          error: "audio required (base64 or url)"
        });
      }

      let buffer;

      // base64 support
      if (audio.startsWith("data:")) {
        buffer = Buffer.from(audio.split(",")[1], "base64");
      } 
      // url support
      else {
        const file = await axios.get(audio, { responseType: "arraybuffer" });
        buffer = Buffer.from(file.data);
      }

      const result = await NoiseRemover.run(buffer);

      if (result.error) {
        return res.status(500).json({
          status: false,
          error: result.message || "Processing failed"
        });
      }

      return res.json({
        status: true,
        creator: "Mohnd",
        result: {
          audio: result.media?.enhanced?.uri || null
        }
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
