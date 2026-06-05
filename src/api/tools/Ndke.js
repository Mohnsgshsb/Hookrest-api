const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");

const AES_KEY = "ai-enhancer-web__aes-key";
const AES_IV = "aienhancer-aesiv";

function encryptSettings(settings) {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);
  return CryptoJS.AES.encrypt(
    JSON.stringify(settings),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  ).toString();
}

async function createTask(base64Image, promptText) {
  const settings = {
    aspect_ratio: "match_input_image",
    output_format: "jpg",
    prompt: promptText
  };

  const payload = {
    model: 2,
    image: [base64Image],
    function: 'ai-image-editor',
    settings: encryptSettings(settings)
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 16; ASUS_AI2401_A Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Origin': 'https://aienhancer.ai',
    'Referer': 'https://aienhancer.ai/ai-image-editor',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'mark.via.gp'
  };

  const res = await fetch('https://aienhancer.ai/api/v1/r/image-enhance/create', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.code !== 100000) throw new Error(data.message);
  return data.data.id;
}

async function pollResult(taskId, interval = 3000, timeout = 90000) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 16; ASUS_AI2401_A Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Origin': 'https://aienhancer.ai',
    'Referer': 'https://aienhancer.ai/ai-image-editor',
    'x-requested-with': 'mark.via.gp'
  };

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await fetch('https://aienhancer.ai/api/v1/r/image-enhance/result', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task_id: taskId })
    });

    const data = await res.json();
    if (data.code !== 100000) throw new Error(data.message);
    const task = data.data;
    if (task.status === 'succeeded') return task.output;
    if (task.status === 'failed') throw new Error(task.error || 'Task failed');
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Timed out waiting for result');
}

module.exports = function (app) {

  // GET: /api/aienhancer?url=IMAGE_URL&prompt=TEXT
  // أو: /api/aienhancer?image=BASE64&prompt=TEXT
  app.get("/api/aienhancer", async (req, res) => {
    try {
      const { url, image, prompt } = req.query;

      if (!prompt) {
        return res.status(400).json({
          status: false,
          error: "prompt required"
        });
      }

      if (!url && !image) {
        return res.status(400).json({
          status: false,
          error: "url or image (base64) required"
        });
      }

      let base64Image;

      // base64 مباشر
      if (image) {
        base64Image = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
      }
      // URL للصورة
      else if (url) {
        const imgRes = await fetch(url);
        if (!imgRes.ok) throw new Error("Invalid image URL");
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const mime = imgRes.headers.get("content-type") || "image/jpeg";
        base64Image = `data:${mime};base64,${buffer.toString("base64")}`;
      }

      // إنشاء التاسك
      const taskId = await createTask(base64Image, prompt);

      // انتظار النتيجة
      const resultUrl = await pollResult(taskId);

      return res.json({
        status: true,
        creator: "Mohnd",
        result: {
          image: resultUrl,
          mode: "ai_enhancer"
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
        
