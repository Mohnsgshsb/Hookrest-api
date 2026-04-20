const Jimp = require("jimp");
const axios = require("axios");

module.exports = (app) => {

  const colorOptions = [
    '#FF0000','#00FF00','#0000FF','#FFFF00',
    '#FFA500','#800080','#808080'
  ];

  const operations = [
    (img) => img.resize(800, Jimp.AUTO),
    (img) => img.convolute([[0,-1,0],[-1,5,-1],[0,-1,0]]),
    (img) => img.brightness(0.1),
    (img) => img.contrast(0.3),
    (img) => img.grayscale(),
    (img) => img.blur(5),
    (img) => img.rotate(90),
    "color",
    (img) => img.opacity(0.8),
    "text",
    "crop",
    "frame",
    "portrait",
    (img) => img.resize(Jimp.AUTO,1080),
    (img) => img.blur(10),
    (img) => img.convolute([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]]),
    (img) => {
      const shadow = img.clone().opacity(0.5).blur(5);
      return img.composite(shadow, 10, 10);
    },
    (img) => img.color([{ apply:'mix', params:['#8B4513',100] }]),
    (img) => img.convolute([[0,-1,0],[-1,5,-1],[0,-1,0]]).contrast(0.3).brightness(0.1),
    (img) => img.color([{ apply:'mix', params:['#000000',50] }]),
    (img) => img.blur(3),
    (img) => img.opacity(0.5)
  ];

  // 🔥 API
  app.get("/api/edit-img", async (req, res) => {
    try {
      const { url, op, text, color } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          message: "📌 حط رابط الصورة"
        });
      }

      if (!op) {
        return res.status(400).json({
          status: false,
          message: "📌 حدد رقم العملية"
        });
      }

      const opIndex = parseInt(op) - 1;

      if (isNaN(opIndex) || opIndex < 0 || opIndex >= operations.length) {
        return res.status(400).json({
          status: false,
          message: "❌ رقم العملية غلط"
        });
      }

      // تحميل الصورة
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const image = await Jimp.read(response.data);

      const selected = operations[opIndex];

      // 🎨 تغيير اللون
      if (selected === "color") {
        const colorIndex = parseInt(color) - 1;
        if (!colorOptions[colorIndex]) {
          return res.json({ status: false, message: "❌ لون غلط" });
        }
        image.color([{ apply: "mix", params: [colorOptions[colorIndex], 100] }]);
      }

      // 📝 نص
      else if (selected === "text") {
        if (!text) {
          return res.json({ status: false, message: "📌 اكتب نص" });
        }
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        image.print(font, 20, 20, text);
      }

      // ✂️ crop
      else if (selected === "crop") {
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        image.crop(w/4, h/4, w/2, h/2);
      }

      // 🖼️ frame blur
      else if (selected === "frame") {
        const blurred = image.clone().blur(10).resize(image.bitmap.width*2, image.bitmap.height*2);
        blurred.composite(image, image.bitmap.width/2, image.bitmap.height/2);
        return blurred.getBufferAsync(Jimp.MIME_JPEG).then(buf => {
          res.set("Content-Type", "image/jpeg");
          res.send(buf);
        });
      }

      // 👤 portrait
      else if (selected === "portrait") {
        const w = image.bitmap.height * (9/16);
        image.resize(w, image.bitmap.height).crop(0,0,w,image.bitmap.height);
      }

      // 🔧 باقي العمليات
      else if (typeof selected === "function") {
        await selected(image);
      }

      const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      res.set("Content-Type", "image/jpeg");
      res.send(buffer);

    } catch (err) {
      res.status(500).json({
        status: false,
        message: "⚠️ حصل خطأ",
        error: err.message
      });
    }
  });

};
