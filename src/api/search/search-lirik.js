const axios = require("axios");

module.exports = function (app) {

    app.get("/api/akinator/start", async (req, res) => {
        try {
            const { data } = await axios.get(
                "https://srv.akinator.com:9157/ws/new_session",
                {
                    params: {
                        partner: 1,
                        player: "website-desktop"
                    }
                }
            );

            const info = data.parameters;

            res.json({
                status: true,
                result: {
                    question: info.step_information.question,
                    step: info.step_information.step,
                    progression: info.step_information.progression,
                    session: info.identification.session,
                    signature: info.identification.signature
                }
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
