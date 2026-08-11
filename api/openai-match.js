const https = require('https');

module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { cv, job, language, documentType } = req.body || {};

        if (!cv || !job) {
            return res.status(400).json({ error: 'Please provide both CV and job description.' });
        }

        const targetLanguage = language || 'English';

        let promptInstruction = '';
        if (documentType === 'letter') {
            promptInstruction = 'Write ONLY a highly compelling, professional cover letter tailored to the job description.';
        } else if (documentType === 'cv') {
            promptInstruction = 'Generate ONLY a fully tailored, optimized Resume / CV matching the job description. Include contact info placeholder, professional summary, key skills, work experience, and education.';
        } else {
            promptInstruction = 'Generate BOTH: 1) A highly compelling, professional cover letter tailored to the job, AND 2) A fully tailored, optimized Resume / CV matching the job description.';
        }

        const postData = JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: `You are an expert HR manager and career advisor. ${promptInstruction} Respond ENTIRELY in ${targetLanguage}. Use clear formatting with bold section headers.` 
                },
                { 
                    role: 'user', 
                    content: `User Input / Background:\n${cv}\n\nJob Description:\n${job}` 
                }
            ]
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            const apiReq = https.request(options, (apiRes) => {
                let data = '';
                apiRes.on('data', (chunk) => { data += chunk; });
                apiRes.on('end', () => {
                    if (apiRes.statusCode >= 400) {
                        res.status(apiRes.statusCode).send(data);
                        resolve();
                    } else {
                        const responseJson = JSON.parse(data);
                        res.status(200).json({ text: responseJson.choices[0].message.content });
                        resolve();
                    }
                });
            });

            apiReq.on('error', (e) => {
                res.status(500).json({ error: e.message });
                resolve();
            });

            apiReq.write(postData);
            apiReq.end();
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
