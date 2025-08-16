import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration, FunctionCall, Part } from "@google/genai";
import type { GeneratedFile, StructuredPrSummary, StructuredExplanation, ColorTheme } from '../types.ts';
import { logError } from './telemetryService.ts';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key not found. Please set the GEMINI_API_KEY environment variable.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Unified AI Helpers ---

async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5) {
    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt as any, // Cast to any to handle both string and parts object
            config: { systemInstruction, temperature }
        });

        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error streaming from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        if (error instanceof Error) {
            yield `An error occurred while communicating with the AI model: ${error.message}`;
        } else {
            yield "An unknown error occurred while generating the response.";
        }
    }
}

async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction, temperature }
        });
        return response.text;
    } catch (error) {
         console.error("Error generating content from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}


async function generateJson<T>(prompt: string, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating JSON from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}


// --- Unified Feature Functions (Streaming) ---

export const explainCodeStream = (code: string) => streamContent(
    `Please explain the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer providing a clear, concise explanation of code."
);

export const generateRegExStream = (description: string) => streamContent(
    `Generate a single valid JavaScript regex literal (e.g., /abc/gi) for the following description. Respond with ONLY the regex literal and nothing else: "${description}"`,
    "You are an expert in regular expressions. You only output valid JavaScript regex literals.",
    0.7
);

export const generateCommitMessageStream = (diff: string) => streamContent(
    `Generate a conventional commit message for the following context of new files being added:\n\n${diff}`,
    "You are an expert programmer who writes excellent, conventional commit messages. The response should be only the commit message text.",
    0.8
);

export const generateUnitTestsStream = (code: string) => streamContent(
    `Generate Vitest unit tests for this React component code:\n\n\`\`\`tsx\n${code}\n\`\`\``,
    "You are a software quality engineer specializing in writing comprehensive and clear unit tests using Vitest and React Testing Library.",
    0.6
);

export const formatCodeStream = (code: string) => streamContent(
    `Format this code:\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are a code formatter. Your only purpose is to format code. Respond with only the formatted code, enclosed in a single markdown block.",
    0.2
);

export const generateComponentFromImageStream = (base64Image: string) => streamContent(
    {
        parts: [
            { text: "Generate a single-file React component using Tailwind CSS that looks like this image. Respond with only the code in a markdown block." },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
        ]
    },
    "You are an expert frontend developer specializing in React and Tailwind CSS. You create clean, functional components from screenshots."
);

export const transcribeAudioToCodeStream = (base64Audio: string, mimeType: string) => streamContent(
    {
        parts: [
            { text: "Transcribe my speech into a code snippet. If I describe a function or component, write it out." },
            { inlineData: { mimeType, data: base64Audio } }
        ]
    },
    "You are an expert programmer. You listen to a user's voice and transcribe their ideas into code."
);

export const transferCodeStyleStream = (args: { code: string, styleGuide: string }) => streamContent(
    `Rewrite the following code to match the provided style guide.\n\nStyle Guide:\n${args.styleGuide}\n\nCode to rewrite:\n\`\`\`\n${args.code}\n\`\`\``,
    "You are an AI assistant that rewrites code to match a specific style guide. Respond with only the rewritten code in a markdown block.",
    0.3
);

export const generateCodingChallengeStream = (_: any) => streamContent(
    `Generate a new, interesting coding challenge suitable for an intermediate developer. Include a clear problem description, one or two examples, and any constraints. Format it in markdown.`,
    "You are an AI that creates unique and interesting coding challenges for software developers.",
    0.9
);

export const reviewCodeStream = (code: string) => streamContent(
    `Please perform a detailed code review on the following code snippet. Identify potential bugs, suggest improvements for readability and performance, and point out any anti-patterns. Structure your feedback with clear headings.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer performing a code review. You are meticulous, helpful, and provide constructive feedback.",
    0.6
);

export const generateChangelogFromLogStream = (log: string) => streamContent(
    `Analyze this git log and create a changelog:\n\n\`\`\`\n${log}\n\`\`\``,
    "You are a git expert and project manager. Analyze the provided git log and generate a clean, categorized changelog in Markdown format. Group changes under 'Features' and 'Fixes'.",
    0.6
);

export const enhanceSnippetStream = (code: string) => streamContent(
    `Enhance this code snippet. Add comments, improve variable names, and refactor for clarity or performance if possible.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer who excels at improving code. Respond with only the enhanced code in a markdown block.",
    0.5
);

export const summarizeNotesStream = (notes: string) => streamContent(
    `Summarize these developer notes into a bulleted list of key points and action items:\n\n${notes}`,
    "You are a productivity assistant who is an expert at summarizing technical notes.",
    0.7
);

export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(
    `Translate this ${from} code to ${to}. Respond with only the translated code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    `You are an expert polyglot programmer who specializes in migrating code between languages and frameworks.`,
    0.4
);

export const analyzeConcurrencyStream = (code: string) => streamContent(
    `Analyze this JavaScript code for potential concurrency issues, especially related to Web Workers. Identify race conditions, deadlocks, or inefficient data passing.\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are an expert in JavaScript concurrency, web workers, and multi-threaded programming concepts.",
    0.6
);

export const debugErrorStream = (error: Error) => streamContent(
    `I encountered an error in my React application. Here are the details:
    
    Message: ${error.message}
    
    Stack Trace:
    ${error.stack}
    
    Please analyze this error. Provide a brief explanation of the likely cause, followed by a bulleted list of potential solutions or debugging steps. Structure your response in clear, concise markdown.`,
    "You are an expert software engineer specializing in debugging React applications. You provide clear, actionable advice to help developers solve errors."
);

export const convertJsonToXbrlStream = (json: string) => streamContent(
    `Convert the following JSON to a simplified, XBRL-like XML format. Use meaningful tags based on the JSON keys. The root element should be <xbrl>. Do not include XML declarations or namespaces.\n\nJSON:\n${json}`,
    "You are an expert in data formats who converts JSON to clean, XBRL-like XML."
);

// --- Simple Generate Content ---
export const generateUnitTests = (code: string): Promise<string> => generateContent(
    `Generate Vitest unit tests for this React component code:\n\n\`\`\`tsx\n${code}\n\`\`\``,
    "You are a software quality engineer specializing in writing unit tests. Respond with only the test code in a markdown block.",
    0.6
);

export const generateCommitMessage = (diff: string): Promise<string> => generateContent(
    `Generate a commit message for the following context of new files being added:\n\n${diff}`,
    "You are an expert programmer who writes excellent, conventional commit messages.",
    0.8
);


// --- STRUCTURED JSON ---

export const explainCodeStructured = async (code: string): Promise<StructuredExplanation> => {
    const systemInstruction = "You are an expert software engineer providing a structured analysis of a code snippet.";
    const prompt = `Analyze this code: \n\n\`\`\`\n${code}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A high-level summary of what the code does." },
            lineByLine: {
                type: Type.ARRAY,
                description: "A line-by-line or block-by-block explanation.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        lines: { type: Type.STRING, description: "The line range, e.g., '1-5'." },
                        explanation: { type: Type.STRING, description: "The explanation for that line range." }
                    },
                    required: ["lines", "explanation"]
                }
            },
            complexity: {
                type: Type.OBJECT,
                description: "Big O notation for time and space complexity.",
                properties: {
                    time: { type: Type.STRING, description: "e.g., O(n^2)" },
                    space: { type: Type.STRING, description: "e.g., O(1)" }
                },
                required: ["time", "space"]
            },
            suggestions: {
                type: Type.ARRAY,
                description: "Suggestions for improvement or alternatives.",
                items: { type: Type.STRING }
            }
        },
        required: ["summary", "lineByLine", "complexity", "suggestions"]
    };

    return generateJson(prompt, systemInstruction, schema);
}

export const generateThemeFromDescription = async (description: string): Promise<ColorTheme> => {
    const systemInstruction = "You are a UI/UX design expert specializing in color theory. Generate a color theme based on the user's description. Provide hex codes for each color.";
    const prompt = `Generate a color theme for: "${description}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            primary: { type: Type.STRING, description: "The primary accent color." },
            background: { type: Type.STRING, description: "The main background color." },
            surface: { type: Type.STRING, description: "The color for card backgrounds or surfaces." },
            textPrimary: { type: Type.STRING, description: "The color for primary text." },
            textSecondary: { type: Type.STRING, description: "The color for secondary or muted text." }
        },
        required: ["primary", "background", "surface", "textPrimary", "textSecondary"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => {
    const systemInstruction = "You are an expert programmer who writes excellent PR summaries.";
    const prompt = `Generate a PR summary for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A concise, conventional PR title." },
            summary: { type: Type.STRING, description: "A one or two sentence summary of the changes." },
            changes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the most important changes." }
        },
        required: ["title", "summary", "changes"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

export const generateFeature = (prompt: string): Promise<GeneratedFile[]> => {
    const systemInstruction = "You are an AI that generates complete, production-ready React components. Create all necessary files (component, styles, etc.).";
    const userPrompt = `Generate the files for the following feature request: "${prompt}". Make sure to include a .tsx component file.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                filePath: { type: Type.STRING, description: "The full path of the file, e.g., 'src/components/MyComponent.tsx'." },
                content: { type: Type.STRING, description: "The complete code content of the file." },
                description: { type: Type.STRING, description: "A brief description of what this file does." }
            },
            required: ["filePath", "content", "description"]
        }
    };
    return generateJson(userPrompt, systemInstruction, schema);
};

export interface CronParts {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}
export const generateCronFromDescription = (description: string): Promise<CronParts> => {
    const systemInstruction = "You are an expert in cron expressions. Convert the user's description into a valid cron expression parts.";
    const prompt = `Convert this schedule to a cron expression: "${description}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            minute: { type: Type.STRING },
            hour: { type: Type.STRING },
            dayOfMonth: { type: Type.STRING },
            month: { type: Type.STRING },
            dayOfWeek: { type: Type.STRING }
        },
        required: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => {
    const systemInstruction = "You are a color theory expert. Generate a 6-color palette based on the given base color.";
    const prompt = `Generate a harmonious 6-color palette based on the color ${baseColor}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["colors"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

// --- FUNCTION CALLING ---
export interface CommandResponse {
    text: string;
    functionCalls?: { name: string; args: any; }[];
}

export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    try {
        const systemInstruction = `You are a helpful assistant for a developer tool. The user will ask you to perform a task.
        Based on your knowledge base of available tools, you must decide which function to call to satisfy the user's request.
        If no specific tool seems appropriate, you can respond with text.
        
        Knowledge Base of Available Tools:
        ${knowledgeBase}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations }],
            }
        });

        const functionCalls: { name: string, args: any }[] = [];
        const parts: Part[] = response.candidates?.[0]?.content?.parts ?? [];
        
        for (const part of parts) {
            if (part.functionCall) {
                functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                });
            }
        }
        
        return {
            text: response.text,
            functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        };

    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};


/**
 * Generates an image from a text prompt using the Gemini API via fetch.
 * Includes a retry mechanism with exponential backoff for improved reliability.
 * @param prompt A text description of the image to generate.
 * @returns A promise that resolves with the data URL of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        throw new Error("Gemini API key not found.");
    }

    const body = {
        "contents": [{
            "parts": [
                { "text": prompt }
            ]
        }],
        "generationConfig": { "responseModalities": ["TEXT", "IMAGE"] }
    };

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'x-goog-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            const imagePart = data.candidates?.[0]?.content?.parts?.find(
                (part: any) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
            );

            if (imagePart && imagePart.inlineData.data) {
                const base64Image = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType;
                return `data:${mimeType};base64,${base64Image}`;
            }

            const textResponse = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
            if (textResponse) {
                 throw new Error(`API returned text instead of an image: ${textResponse}`);
            }
            throw new Error("API response did not contain valid image data.");

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logError(lastError, { context: 'generateImageFetch', attempt: i + 1, prompt });
            console.warn(`Attempt ${i + 1} failed. Retrying in ${Math.pow(2, i)}s...`);
            if (i < MAX_RETRIES - 1) {
                await sleep(1000 * Math.pow(2, i)); // Exponential backoff: 1s, 2s
            }
        }
    }

    throw new Error(`Failed to generate image after ${MAX_RETRIES} attempts. The service may be busy or the prompt may have been blocked. Please try again with a different prompt. Last error: ${lastError?.message}`);
};