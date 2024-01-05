// api.js
export const apiManager = {
    callOpenAI: async function(preprompt, contextPrompt) {
        // Construct the full prompt
        const fullPrompt = `${preprompt}\n\n${contextPrompt}`;

        // Fetch the apiKey directly within the function to ensure it's always current
        const apiKey = game.settings.get('5e-gpt-populator', 'openaiApiKey');
        if (!apiKey) {
            console.error("OpenAI API key is not set in the 5e-gpt-populator module settings.");
            return null;
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: game.settings.get('5e-gpt-populator', 'model'),
                messages: [
                    {
                        role: "system",
                        content: preprompt
                    },
                    {
                        role: "user",
                        content: contextPrompt
                    }
                ],
                temperature: game.settings.get('5e-gpt-populator', 'temperature'),
                max_tokens: max_tokens,
                response_format: { type: "json_object" },
            }),
        };

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
            if (!response.ok) {
                console.error('OpenAI API error:', response.statusText);
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            return null;
        }
    },

    // Additional API related functions can be added here
};

