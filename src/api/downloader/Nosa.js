const fetch = require('node-fetch');

const gemini = {
  getNewCookie: async function () {
    const r = await fetch(
      "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body:
          "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
        method: "POST",
      }
    );

    const cookieHeader = r.headers.get("set-cookie");
    if (!cookieHeader) throw new Error("No cookie found");
    return cookieHeader.split(";")[0];
  },

  ask: async function (prompt) {
    if (!prompt || !prompt.trim()) {
      throw new Error("Invalid prompt");
    }

    const cookie = await this.getNewCookie();

    const headers = {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      cookie,
    };

    const b = [[prompt], ["en-US"], null];
    const a = [null, JSON.stringify(b)];

    const body = new URLSearchParams({
      "f.req": JSON.stringify(a),
    });

    const res = await fetch(
      "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?hl=en-US",
      {
        method: "POST",
        headers,
        body,
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini error: ${res.status}`);
    }

    const data = await res.text();
    const matches = [...data.matchAll(/^\d+\n(.+?)\n/gm)].map((m) => m[1]);

    let text = null;

    for (const chunk of matches.reverse()) {
      try {
        const parsed = JSON.parse(chunk);
        const inner = JSON.parse(parsed[0][2]);

        if (inner?.[4]?.[0]?.[1]?.[0]) {
          text = inner[4][0][1][0];
          break;
        }
      } catch {}
    }

    if (!text) throw new Error("Failed to parse response");

    return text;
  },
};

module.exports = function (app) {
  app.get("/api/gemini", async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: "حط prompt"
      });
    }

    try {
      const result = await gemini.ask(prompt);

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: result
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message
      });
    }
  });
};
