const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    try {
        const { cv, job } = JSON.parse(event.body);
        const response = await fetch('https://openai.com', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert HR manager. Write a highly compelling, professional cover letter tailored to the job description and the users resume. At the end, provide 3 actionable bullet points to improve their resume for this specific job. Respond entirely in English.' },
                    { role: 'user', content: `Resume:\n${cv}\n\nJob Description:\n${job}` }
                ]
            })
        });
        const data = await response.json();
        if (data.error) {
            return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ text: data.choices.message.content })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
