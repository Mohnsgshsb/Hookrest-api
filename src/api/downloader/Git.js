const axios = require('axios');
const FormData = require('form-data');

module.exports = function (app) {

    app.get('/tools/upscale', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "حط رابط الصورة"
                });
            }

            // تحميل الصورة
            const img = await axios.get(url, {
                responseType: 'arraybuffer'
            });

            const form = new FormData();
            form.append('image', Buffer.from(img.data), 'image.jpg');
            form.append('scale', '2');

            // رفع للصيرفر
            const response = await axios.post(
                'https://api2.pixelcut.app/image/upscale/v1',
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        'accept': 'application/json',
                        'x-client-version': 'web'
                    }
                }
            );

            const resultUrl = response.data?.result_url;

            if (!resultUrl) {
                return res.status(500).json({
                    status: false,
                    error: "No result URL"
                });
            }

            // تحميل الصورة بعد التكبير
            const finalImg = await axios.get(resultUrl, {
                responseType: 'arraybuffer'
            });

            res.setHeader('Content-Type', 'image/jpeg');
            res.send(finalImg.data);

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
