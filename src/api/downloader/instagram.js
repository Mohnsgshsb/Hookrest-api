const https = require("https");
const crypto = require("crypto");

module.exports = function (app) {

    const COOKIE_STR =
        '__Secure-authjs.callback-url=https%3A%2F%2Fdemo.chat-sdk.dev%2Fapi%2Fchat; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiVXNicXV0LWJsOXRjYmtuZTFwUklIZHNrbUxLczZ0bzdZRk1xV2pGVnhDQ0ZFbVBxR2NEbi04UGNYdXlVeWFCQmZGVFlaYkEtbjBZeFlOd2tlSVRjeWcifQ..hGvHEgPFgrgO2xeuHyjBw.Km9d2qnP3VZtKP-xm3XfI-ygaDYP5gHOONG9c8fxgBefThBmVRmqkXvx5fm9x8n8NHKKz7EDx1YYGG4okcm7IcFJaJMOSk0wkgvO4VrSC0mBt321fH4gN76qqKhOLTrmy1tQa3OL1lRkscclS7II8wsKf62Y-8G7u2pmeLCtcXs0ShltjY2CltC5-6_UjTuG_p4dHbtI4rRgxWcvQyh-EwNSKwkDHzBVURHLnld1Eu8z07p5i25NwHGutf2kgTBQSlO7Zryrkwb7AWcg8CxW4QvB6fODf6m9ZS2Uf4rps04.73sZPy4T-mr1DS0pOZkZPH8Uip6kpHvn-3OW01ms6Qo; chat-model=openai/gpt-5.2';

    const HEADERS = {
        authority: "demo.chat-sdk.dev",
        accept: "application/json, text/plain, */*",
        "accept-language": "es-ES,es;q=0.9,en;q=0.8",
        cookie: COOKIE_STR,
        referer: "https://demo.chat-sdk.dev/chat",
        "user-agent":
            "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36",
        "x-requested-with": "mark.via.gp"
    };

    function sendChat(textMessage) {
        return new Promise((resolve, reject) => {

            const chatId = crypto.randomUUID();
            const messageId = crypto.randomUUID();

            const payload = JSON.stringify({
                message: {
                    role: "user",
                    parts: [{ type: "text", text: textMessage }],
                    id: messageId
                },
                selectedChatModel: "openai/gpt-5.2",
                selectedVisibilityType: "private",
                id: chatId
            });

            const req = https.request(
                {
                    hostname: "demo.chat-sdk.dev",
                    path: "/api/chat",
                    method: "POST",
                    headers: {
                        ...HEADERS,
                        "content-type": "application/json",
                        "content-length": Buffer.byteLength(payload)
                    }
                },
                (res) => {
                    let buffer = "";
                    let finalText = "";

                    res.on("data", (chunk) => {
                        buffer += chunk.toString();

                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const jsonStr = line.replace("data: ", "").trim();
                                if (jsonStr === "[DONE]") continue;

                                try {
                                    const data = JSON.parse(jsonStr);
                                    if (data.type === "text-delta" && data.delta) {
                                        finalText += data.delta;
                                    }
                                } catch {}
                            }
                        }
                    });

                    res.on("end", () => {
                        if (finalText.trim()) return resolve(finalText.trim());
                        reject(new Error("No response"));
                    });
                }
            );

            req.on("error", reject);
            req.write(payload);
            req.end();
        });
    }

    // =========================
    // API ENDPOINT
    // =========================
    app.get("/api/gpt52", async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "حط السؤال ?q="
            });
        }

        try {
            const result = await sendChat(q);

            res.json({
                status: true,
                creator: "Mohnd",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
