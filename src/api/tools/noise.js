const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

  const nano = {
    api: {
      base: "https://imgeditor.co/api",
      upload: "/get-upload-url",
      generate: "/generate-image",
      status: "/generate-image/status"
    },

    headers: {
      "user-agent": "NB Android/1.0.0",
      accept: "*/*"
    },

    // 🔥 upload image buffer
    getUploadUrl: async (buffer) => {
      const { data } = await axios.post(
        nano.api.base + nano.api.upload,
        {
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          fileSize: buffer.length
        },
        { headers: { "content-type": "application/json", ...nano.headers } }
      );

      return data;
    },

    upload: async (url, buffer) => {
      await axios.put(url, buffer, {
        headers: {
          "content-type": "image/jpeg"
        }
      });
    },

    generate: async (imageUrl, prompt) => {
      const { data } = await axios.post(
        nano.api.base + nano.api.generate,
        {
          prompt,
          styleId: "realistic",
          mode: "image",
          imageUrl,
          imageUrls: [imageUrl],
          numImages: 1,
          outputFormat: "png",
          model: "nano-banana"
        },
        { headers: nano.headers }
      );

      return data;
    },

    check: async (taskId) => {
      let attempts = 0;

      while (attempts < 40) {
        await new Promise(r => setTimeout(r, 2500));

        const { data } = await axios.get(
          `${nano.api.base}${nano.api.status}?taskId=${taskId}`
        );

        if (data.status === "completed") return data.imageUrl;
        if (data.status === "failed") throw new Error("Generation failed");

        attempts++;
      }

      throw new Error("Timeout");
    }
  };

  // =========================
  // REST API ENDPOINT
  // =========================
  app.post("/api/nano", async (req, res) => {
    try {

      const { image, prompt } = req.body;

      if (!image) {
        return res.status(400).json({
          status: false,
          error: "image required (url or base64)"
        });
      }

      if (!prompt) {
        return res.status(400).json({
          status: false,
          error: "prompt required"
        });
      }

      let buffer;

      // base64
      if (image.startsWith("data:")) {
        buffer = Buffer.from(image.split(",")[1], "base64");
      }

      // url
      else {
        const img = await axios.get(image, {
          responseType: "arraybuffer"
        });
        buffer = Buffer.from(img.data);
      }

      // 1 upload url
      const upload = await nano.getUploadUrl(buffer);

      // 2 upload image
      await nano.upload(upload.uploadUrl, buffer);

      // 3 generate
      const task = await nano.generate(upload.publicUrl, prompt);

      // 4 wait result
      const result = await nano.check(task.taskId);

      return res.json({
        status: true,
        creator: "Mohnd",
        result: {
          image: result,
          prompt
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
