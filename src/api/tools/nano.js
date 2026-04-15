const fetch = require("node-fetch");

module.exports = function (app) {

  class ImgEditor {
    static base = "https://imgeditor.co/api";

    static async getUploadUrl(buffer) {
      const res = await fetch(`${this.base}/get-upload-url`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          fileSize: buffer.length
        })
      });

      return res.json();
    }

    static async upload(uploadUrl, buffer) {
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        body: buffer
      });
    }

    static async generate(prompt, imageUrl) {
      const res = await fetch(`${this.base}/generate-image`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          styleId: "realistic",
          mode: "image",
          imageUrl,
          imageUrls: [imageUrl],
          numImages: 1,
          outputFormat: "png",
          model: "nano-banana"
        })
      });

      return res.json();
    }

    static async check(taskId) {
      let attempts = 0;

      while (attempts < 40) {
        await new Promise(r => setTimeout(r, 2500));

        const res = await fetch(
          `${this.base}/generate-image/status?taskId=${taskId}`
        );

        const json = await res.json();

        if (json.status === "completed") return json.imageUrl;
        if (json.status === "failed") throw new Error("Task failed");

        attempts++;
      }

      throw new Error("Timeout generating image");
    }
  }

  // =========================
  // API ENDPOINT
  // =========================
  app.post("/api/nano", async (req, res) => {
    try {
      const { image, prompt } = req.body;

      if (!image) {
        return res.status(400).json({
          status: false,
          error: "حط صورة base64 أو url"
        });
      }

      if (!prompt) {
        return res.status(400).json({
          status: false,
          error: "حط البرومت"
        });
      }

      // تحويل base64 → buffer (لو جاي من بوت)
      let buffer;

      if (image.startsWith("data:")) {
        buffer = Buffer.from(image.split(",")[1], "base64");
      } else {
        const img = await fetch(image);
        buffer = Buffer.from(await img.arrayBuffer());
      }

      // 1. upload url
      const up = await ImgEditor.getUploadUrl(buffer);

      // 2. upload image
      await ImgEditor.upload(up.uploadUrl, buffer);

      // 3. generate
      const task = await ImgEditor.generate(prompt, up.publicUrl);

      // 4. wait result
      const resultUrl = await ImgEditor.check(task.taskId);

      return res.json({
        status: true,
        creator: "Mohnd",
        result: {
          image: resultUrl,
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
