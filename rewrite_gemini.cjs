const fs = require('fs');
const content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const replacement = `import { Type, GenerateContentResponse, FunctionDeclaration, FunctionCall, Part } from "@google/genai";
import type { GeneratedFile, StructuredPrSummary, StructuredExplanation, ColorTheme, RepoTemplate, CertificateDetails } from '../types.ts';
import { logError } from './telemetryService.ts';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Unified AI Helpers ---

async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5) {
    try {
        const response = await fetch('/api/gemini/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemInstruction, temperature })
        });
        
        if (!response.ok) {
            throw new Error(\`Server returned \${response.status}: \${await response.text()}\`);
        }
        if (!response.body) {
            throw new Error("No response body returned from stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\\n\\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') {
                        break;
                    }
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.text) {
                            yield data.text;
                        }
                    } catch (e) {
                        console.error('Error parsing stream data', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error streaming from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        if (error instanceof Error) {
            yield \`An error occurred while communicating with the AI model: \${error.message}\`;
        } else {
            yield "An unknown error occurred while generating the response.";
        }
    }
}

async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    try {
        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemInstruction, temperature })
        });
        if (!response.ok) {
            throw new Error(\`Server returned \${response.status}: \${await response.text()}\`);
        }
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error generating content from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

async function generateJson<T>(prompt: string, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    try {
        const response = await fetch('/api/gemini/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemInstruction, schema, temperature })
        });
        if (!response.ok) {
            throw new Error(\`Server returned \${response.status}: \${await response.text()}\`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error generating JSON from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}
`;

// we need to replace everything from the beginning of the file up to the first export.
const exportIndex = content.indexOf('export const debugErrorStream');
if (exportIndex === -1) {
    console.error("Could not find 'export const debugErrorStream'");
    process.exit(1);
}

const newContent = replacement + "\n" + content.substring(exportIndex);
fs.writeFileSync('src/services/geminiService.ts', newContent);
