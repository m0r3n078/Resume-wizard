const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    try {
        const { cv, job } = JSON.parse(event.body);
        
        const postData = JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are an expert HR manager. Write a highly compelling, professional cover letter tailored to the job description and the users resume. At the end, provide 3 actionable bullet points to improve their resume for this specific job. Respond entirely in English.' },
                { role: 'user', content: `Resume:\n${cv}\n\nJob Description:\n${job}` }
            ]
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: '://openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        resolve({ statusCode: res.statusCode, body: data });
                    } else {
                        const responseJson = JSON.parse(data);
                        resolve({
                            statusCode: 200,
                            body: JSON.stringify({ text: responseJson.choices[0].message.content })
                        });
                    }
                });
            });

            req.on('error', (e) => {
                resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
            });

            req.write(postData);
            req.end();
        });

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
