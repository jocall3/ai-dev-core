import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();

const getAi = () => {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API key not found. Please set the API_KEY or GEMINI_API_KEY environment variable.");
    }
    return new GoogleGenAI({ apiKey });
};

app.use(express.json({ limit: '50mb' }));

app.post('/gemini/stream', async (req, res) => {
    try {
        const { prompt, systemInstruction, temperature } = req.body;
        const ai = getAi();
        
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction, temperature: temperature || 0.5 }
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of response) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error("Error streaming from AI model:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/gemini/generate', async (req, res) => {
    try {
        const { prompt, systemInstruction, temperature } = req.body;
        const ai = getAi();
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction, temperature: temperature || 0.5 }
        });

        res.json({ text: response.text });
    } catch (error: any) {
        console.error("Error generating content from AI model:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/gemini/json', async (req, res) => {
    try {
        const { prompt, systemInstruction, schema, temperature } = req.body;
        const ai = getAi();
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                systemInstruction, 
                temperature: temperature || 0.2,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const parsed = JSON.parse(response.text.trim());
        res.json(parsed);
    } catch (error: any) {
        console.error("Error generating JSON from AI model:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/gemini/inference', async (req, res) => {
    try {
        const { prompt, functionDeclarations, knowledgeBase } = req.body;
        const ai = getAi();
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: `You are the AI command center for a developer toolkit. Your goal is to understand the user's request and call the appropriate function to activate a tool. Use the provided knowledge base to map user requests to the correct 'featureId' for the 'navigateTo' or 'runFeatureWithInput' functions. If the user provides data directly in the prompt (like a code snippet), use the 'runFeatureWithInput' function. Otherwise, use 'navigateTo'. Do not make up feature IDs; only use the ones provided in the knowledge base. If no specific tool seems appropriate, respond with helpful text.\n\nKnowledge Base:\n${knowledgeBase}`,
                tools: [{ functionDeclarations }],
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            const functionCalls = parts
                .filter(part => 'functionCall' in part)
                .map(part => part.functionCall);

            if (functionCalls.length > 0) {
                return res.json({ functionCalls });
            }
        }
        res.json({ text: response.text });
    } catch (error: any) {
        console.error("Error inferring function call:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        const ai = getAi();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            }
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        res.json({ image: `data:image/png;base64,${base64ImageBytes}` });
    } catch (error: any) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: error.message });
    }
});

export default app;
