import React, { lazy } from 'react';
import { Octokit } from 'octokit';
import { openDB, DBSchema } from 'idb';
import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import type { User, Repo, FileNode, GeneratedFile, StructuredPrSummary, StructuredExplanation, ColorTheme } from '../types.ts';

// --- Telemetry Service ---
const isTelemetryEnabled = true;

const sanitizePayload = (payload: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            if (typeof value === 'string' && value.length > 500) {
                sanitized[key] = `${value.substring(0, 100)}... (truncated)`;
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
};

export const logEvent = (eventName: string, payload: Record<string, any> = {}) => {
  if (!isTelemetryEnabled) return;
  console.log(`%c[TELEMETRY EVENT]%c ${eventName}`, 'color: #84cc16; font-weight: bold;', 'color: inherit;', sanitizePayload(payload));
};

export const logError = (error: Error, context: Record<string, any> = {}) => {
  if (!isTelemetryEnabled) return;
  console.error(`%c[TELEMETRY ERROR]%c ${error.message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', { error, context: sanitizePayload(context), stack: error.stack });
};

export const measurePerformance = async <T>(metricName: string, operation: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const end = performance.now();
    const duration = end - start;
    if (isTelemetryEnabled) {
      console.log(`%c[TELEMETRY PERF]%c ${metricName}`, 'color: #3b82f6; font-weight: bold;', 'color: inherit;', { duration: `${duration.toFixed(2)}ms` });
    }
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
     if (isTelemetryEnabled) {
        console.warn(`%c[TELEMETRY PERF FAILED]%c ${metricName}`, 'color: #f97316; font-weight: bold;', 'color: inherit;', { duration: `${duration.toFixed(2)}ms`, error });
      }
    throw error;
  }
};


// --- Auth Service ---
const TOKEN_EXCHANGE_PROXY_URL = 'https://citibankdemobusiness.dev/oauth/callback.php';

interface AuthResult {
    user: User;
    token: string;
}

let octokitInstance: Octokit | null = null;

const getAccessToken = async (code: string): Promise<string> => {
    logEvent('auth_token_exchange_start');
    const response = await fetch(`${TOKEN_EXCHANGE_PROXY_URL}?code=${code}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
        const errorBody = await response.text();
        logError(new Error(`Token exchange failed: ${response.status}`), { context: 'getAccessToken', errorBody });
        throw new Error(`Token exchange failed with status ${response.status}. Please check the proxy endpoint.`);
    }
    const data = await response.json();
    if (data.error || !data.access_token) {
        logError(new Error('Invalid token response from proxy'), { context: 'getAccessToken', responseData: data });
        throw new Error(data.error_description || 'Backend proxy failed to retrieve a valid access token.');
    }
    logEvent('auth_token_exchange_success');
    return data.access_token;
};

const initializeOctokit = (token: string): void => {
    octokitInstance = new Octokit({ auth: token, request: { headers: { 'X-GitHub-Api-Version': '2022-11-28' } } });
    logEvent('octokit_initialized');
};

export const getOctokit = (): Octokit => {
    if (!octokitInstance) { throw new Error("Octokit has not been initialized. Please authenticate first."); }
    return octokitInstance;
};

export const handleGitHubCallback = async (code: string): Promise<AuthResult> => {
    return measurePerformance('handleGitHubCallback', async () => {
        try {
            const token = await getAccessToken(code);
            initializeOctokit(token);
            const octokit = getOctokit();
            logEvent('fetch_user_profile_start');
            const { data: user } = await octokit.request('GET /user');
            logEvent('fetch_user_profile_success', { username: user.login });
            return { user: user as unknown as User, token };
        } catch (error) {
            logError(error as Error, { context: 'handleGitHubCallback', code });
            throw new Error(`Authentication failed: ${(error as Error).message}`);
        }
    });
};

export const checkSession = async (token: string | null): Promise<AuthResult | null> => {
    if (!token) return null;
    return measurePerformance('checkSession', async () => {
        logEvent('session_check_start');
        try {
            initializeOctokit(token);
            const octokit = getOctokit();
            const { data: user } = await octokit.request('GET /user');
            logEvent('session_check_success', { username: user.login });
            return { user: user as unknown as User, token };
        } catch (error) {
            logError(error as Error, { context: 'checkSession', message: "Token validation failed, session is invalid." });
            octokitInstance = null;
            return null;
        }
    });
};

export const logout = async (): Promise<void> => {
    logEvent('logout');
    octokitInstance = null;
    return Promise.resolve();
};

// --- GitHub Service ---
export const getRepos = async (): Promise<Repo[]> => {
    return measurePerformance('getRepos', async () => {
        logEvent('getRepos_start');
        try {
            const octokit = getOctokit();
            const { data } = await octokit.request('GET /user/repos', { type: 'owner', sort: 'updated', per_page: 100 });
            logEvent('getRepos_success', { count: data.length });
            return data as Repo[];
        } catch (error) {
            logError(error as Error, { context: 'getRepos' });
            throw new Error(`Failed to fetch repositories: ${(error as Error).message}`);
        }
    });
};

export const deleteRepo = async (owner: string, repo: string): Promise<void> => {
     return measurePerformance('deleteRepo', async () => {
        logEvent('deleteRepo_start', { owner, repo });
        try {
            const octokit = getOctokit();
            await octokit.request('DELETE /repos/{owner}/{repo}', { owner, repo });
            logEvent('deleteRepo_success', { owner, repo });
        } catch (error) {
            logError(error as Error, { context: 'deleteRepo', owner, repo });
            throw new Error(`Failed to delete repository: ${(error as Error).message}`);
        }
    });
};

export const getRepoTree = async (owner: string, repo: string): Promise<FileNode> => {
     return measurePerformance('getRepoTree', async () => {
        logEvent('getRepoTree_start', { owner, repo });
        try {
            const octokit = getOctokit();
            const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
            const defaultBranch = repoData.default_branch;
            const { data: branch } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', { owner, repo, branch: defaultBranch });
            const treeSha = branch.commit.commit.tree.sha;
            const { data: treeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', { owner, repo, tree_sha: treeSha, recursive: 'true' });
            const root: FileNode = { name: repo, type: 'folder', path: '', children: [] };
            treeData.tree.forEach((item: any) => {
                if (!item.path) return;
                const pathParts = item.path.split('/');
                let currentNode = root;
                pathParts.forEach((part, index) => {
                    if (!currentNode.children) { currentNode.children = []; }
                    let childNode = currentNode.children.find(child => child.name === part);
                    if (!childNode) {
                        const isLastPart = index === pathParts.length - 1;
                        childNode = { name: part, path: pathParts.slice(0, index + 1).join('/'), type: isLastPart ? (item.type === 'tree' ? 'folder' : 'file') : 'folder' };
                         if (childNode.type === 'folder') { childNode.children = []; }
                        currentNode.children.push(childNode);
                    }
                    currentNode = childNode;
                });
            });
            logEvent('getRepoTree_success', { owner, repo, items: treeData.tree.length });
            return root;
        } catch (error) {
            logError(error as Error, { context: 'getRepoTree', owner, repo });
            throw new Error(`Failed to fetch repository tree: ${(error as Error).message}`);
        }
    });
};

export const getFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
    return measurePerformance('getFileContent', async () => {
        logEvent('getFileContent_start', { owner, repo, path });
        try {
            const octokit = getOctokit();
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path });
            if (Array.isArray(data) || data.type !== 'file' || typeof data.content !== 'string') { throw new Error("Path did not point to a valid file or content was missing."); }
            const content = atob(data.content);
            logEvent('getFileContent_success', { owner, repo, path, size: content.length });
            return content;
        } catch (error) {
             logError(error as Error, { context: 'getFileContent', owner, repo, path });
             throw new Error(`Failed to fetch file content for "${path}": ${(error as Error).message}`);
        }
    });
};

export const commitFiles = async (
    owner: string,
    repo: string,
    files: { filePath: string; content: string }[],
    message: string,
    branch: string = 'main'
): Promise<string> => {
    return measurePerformance('commitFiles', async () => {
        logEvent('commitFiles_start', { owner, repo, fileCount: files.length, branch });
        const octokit = getOctokit();

        try {
            // 1. Get the latest commit SHA of the branch.
            const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
                owner,
                repo,
                ref: `heads/${branch}`,
            });
            const latestCommitSha = refData.object.sha;

            // 2. Get the base tree SHA from that commit.
            const { data: commitData } = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
                owner,
                repo,
                commit_sha: latestCommitSha,
            });
            const baseTreeSha = commitData.tree.sha;

            // 3. Create new blob(s) for the file content.
            const blobPromises = files.map(file =>
                octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
                    owner,
                    repo,
                    content: file.content,
                    encoding: 'utf-8',
                })
            );
            const blobs = await Promise.all(blobPromises);
            
            // 4. Create the tree object.
            const tree = blobs.map((blob, index) => ({
                path: files[index].filePath,
                mode: '100644' as const, // file mode
                type: 'blob' as const,
                sha: blob.data.sha,
            }));

            const { data: newTree } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
                owner,
                repo,
                base_tree: baseTreeSha,
                tree,
            });

            // 5. Create a new commit pointing to the new tree.
            const { data: newCommit } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
                owner,
                repo,
                message,
                tree: newTree.sha,
                parents: [latestCommitSha],
            });

            // 6. Update the branch reference to point to the new commit.
            await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
                owner,
                repo,
                ref: `heads/${branch}`,
                sha: newCommit.sha,
            });

            logEvent('commitFiles_success', { commitUrl: newCommit.html_url });
            return newCommit.html_url;

        } catch (error) {
            logError(error as Error, { context: 'commitFiles', owner, repo, branch });
            throw new Error(`Failed to commit files: ${(error as Error).message}`);
        }
    });
};

// --- Gemini Service ---
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { throw new Error("Gemini API key not found. Please set the GEMINI_API_KEY environment variable."); }
const ai = new GoogleGenAI({ apiKey: API_KEY });
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5) {
    try {
        const response = await ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: prompt as any, config: { systemInstruction, temperature } });
        for await (const chunk of response) { yield chunk.text; }
    } catch (error) {
        console.error("Error streaming from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        if (error instanceof Error) { yield `An error occurred while communicating with the AI model: ${error.message}`; } else { yield "An unknown error occurred while generating the response."; }
    }
}

async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { systemInstruction, temperature } });
        return response.text;
    } catch (error) {
         console.error("Error generating content from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

async function generateJson<T>(prompt: string, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema, temperature } });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating JSON from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

export const explainCodeStream = (code: string) => streamContent(`Please explain the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``, "You are an expert software engineer providing a clear, concise explanation of code.");
export const generateRegExStream = (description: string) => streamContent(`Generate a single valid JavaScript regex literal (e.g., /abc/gi) for the following description. Respond with ONLY the regex literal and nothing else: "${description}"`, "You are an expert in regular expressions. You only output valid JavaScript regex literals.", 0.7);
export const generateCommitMessageStream = (diff: string) => streamContent(`Generate a conventional commit message for the following context of new files being added:\n\n${diff}`, "You are an expert programmer who writes excellent, conventional commit messages. The response should be only the commit message text.", 0.8);
export const generateUnitTestsStream = (code: string) => streamContent(`Generate Vitest unit tests for this React component code:\n\n\`\`\`tsx\n${code}\n\`\`\``, "You are a software quality engineer specializing in writing comprehensive and clear unit tests using Vitest and React Testing Library.", 0.6);
export const formatCodeStream = (code: string) => streamContent(`Format this code:\n\n\`\`\`javascript\n${code}\n\`\`\``, "You are a code formatter. Your only purpose is to format code. Respond with only the formatted code, enclosed in a single markdown block.", 0.2);
export const generateComponentFromImageStream = (base64Image: string) => streamContent({ parts: [{ text: "Generate a single-file React component using Tailwind CSS that looks like this image. Respond with only the code in a markdown block." }, { inlineData: { mimeType: 'image/png', data: base64Image } }] }, "You are an expert frontend developer specializing in React and Tailwind CSS. You create clean, functional components from screenshots.");
export const transcribeAudioToCodeStream = (base64Audio: string, mimeType: string) => streamContent({ parts: [{ text: "Transcribe my speech into a code snippet. If I describe a function or component, write it out." }, { inlineData: { mimeType, data: base64Audio } }] }, "You are an expert programmer. You listen to a user's voice and transcribe their ideas into code.");
export const transferCodeStyleStream = (args: { code: string, styleGuide: string }) => streamContent(`Rewrite the following code to match the provided style guide.\n\nStyle Guide:\n${args.styleGuide}\n\nCode to rewrite:\n\`\`\`\n${args.code}\n\`\`\``, "You are an AI assistant that rewrites code to match a specific style guide. Respond with only the rewritten code in a markdown block.", 0.3);
export const generateCodingChallengeStream = (_: any) => streamContent(`Generate a new, interesting coding challenge suitable for an intermediate developer. Include a clear problem description, one or two examples, and any constraints. Format it in markdown.`, "You are an AI that creates unique and interesting coding challenges for software developers.", 0.9);
export const reviewCodeStream = (code: string) => streamContent(`Please perform a detailed code review on the following code snippet. Identify potential bugs, suggest improvements for readability and performance, and point out any anti-patterns. Structure your feedback with clear headings.\n\n\`\`\`\n${code}\n\`\`\``, "You are a senior software engineer performing a code review. You are meticulous, helpful, and provide constructive feedback.", 0.6);
export const generateChangelogFromLogStream = (log: string) => streamContent(`Analyze this git log and create a changelog:\n\n\`\`\`\n${log}\n\`\`\``, "You are a git expert and project manager. Analyze the provided git log and generate a clean, categorized changelog in Markdown format. Group changes under 'Features' and 'Fixes'.", 0.6);
export const enhanceSnippetStream = (code: string) => streamContent(`Enhance this code snippet. Add comments, improve variable names, and refactor for clarity or performance if possible.\n\n\`\`\`\n${code}\n\`\`\``, "You are a senior software engineer who excels at improving code. Respond with only the enhanced code in a markdown block.", 0.5);
export const summarizeNotesStream = (notes: string) => streamContent(`Summarize these developer notes into a bulleted list of key points and action items:\n\n${notes}`, "You are a productivity assistant who is an expert at summarizing technical notes.", 0.7);
export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(`Translate this ${from} code to ${to}. Respond with only the translated code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``, `You are an expert polyglot programmer who specializes in migrating code between languages and frameworks.`, 0.4);
export const analyzeConcurrencyStream = (code: string) => streamContent(`Analyze this JavaScript code for potential concurrency issues, especially related to Web Workers. Identify race conditions, deadlocks, or inefficient data passing.\n\n\`\`\`javascript\n${code}\n\`\`\``, "You are an expert in JavaScript concurrency, web workers, and multi-threaded programming concepts.", 0.6);
export const debugErrorStream = (error: Error) => streamContent(`I encountered an error in my React application. Here are the details:\n    \n    Message: ${error.message}\n    \n    Stack Trace:\n    ${error.stack}\n    \n    Please analyze this error. Provide a brief explanation of the likely cause, followed by a bulleted list of potential solutions or debugging steps. Structure your response in clear, concise markdown.`, "You are an expert software engineer specializing in debugging React applications. You provide clear, actionable advice to help developers solve errors.");
export const convertJsonToXbrlStream = (json: string) => streamContent(`Convert the following JSON to a simplified, XBRL-like XML format. Use meaningful tags based on the JSON keys. The root element should be <xbrl>. Do not include XML declarations or namespaces.\n\nJSON:\n${json}`, "You are an expert in data formats who converts JSON to clean, XBRL-like XML.");
export const generateUnitTests = (code: string): Promise<string> => generateContent(`Generate Vitest unit tests for this React component code:\n\n\`\`\`tsx\n${code}\n\`\`\``, "You are a software quality engineer specializing in writing unit tests. Respond with only the test code in a markdown block.", 0.6);
export const generateCommitMessage = (diff: string): Promise<string> => generateContent(`Generate a commit message for the following context of new files being added:\n\n${diff}`, "You are an expert programmer who writes excellent, conventional commit messages.", 0.8);

export const explainCodeStructured = async (code: string): Promise<StructuredExplanation> => generateJson(`Analyze this code: \n\n\`\`\`\n${code}\n\`\`\``, "You are an expert software engineer providing a structured analysis of a code snippet.", { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, lineByLine: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lines: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["lines", "explanation"] } }, complexity: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, space: { type: Type.STRING } }, required: ["time", "space"] }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["summary", "lineByLine", "complexity", "suggestions"] });
export const generateThemeFromDescription = async (description: string): Promise<ColorTheme> => generateJson(`Generate a color theme for: "${description}"`, "You are a UI/UX design expert specializing in color theory. Generate a color theme based on the user's description. Provide hex codes for each color.", { type: Type.OBJECT, properties: { primary: { type: Type.STRING }, background: { type: Type.STRING }, surface: { type: Type.STRING }, textPrimary: { type: Type.STRING }, textSecondary: { type: Type.STRING } }, required: ["primary", "background", "surface", "textPrimary", "textSecondary"] });
export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => generateJson(`Generate a PR summary for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``, "You are an expert programmer who writes excellent PR summaries.", { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, changes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "summary", "changes"] });
export const generateFeature = (prompt: string): Promise<GeneratedFile[]> => generateJson(`Generate the files for the following feature request: "${prompt}". Make sure to include a .tsx component file.`, "You are an AI that generates complete, production-ready React components. Create all necessary files (component, styles, etc.).", { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, content: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["filePath", "content", "description"] } });
export interface CronParts { minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string; }
export const generateCronFromDescription = (description: string): Promise<CronParts> => generateJson(`Convert this schedule to a cron expression: "${description}"`, "You are an expert in cron expressions. Convert the user's description into a valid cron expression parts.", { type: Type.OBJECT, properties: { minute: { type: Type.STRING }, hour: { type: Type.STRING }, dayOfMonth: { type: Type.STRING }, month: { type: Type.STRING }, dayOfWeek: { type: Type.STRING } }, required: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] });
export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => generateJson(`Generate a harmonious 6-color palette based on the color ${baseColor}.`, "You are a color theory expert. Generate a 6-color palette based on the given base color.", { type: Type.OBJECT, properties: { colors: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["colors"] });

export interface CommandResponse { text: string; functionCalls?: { name: string; args: any; }[]; }
export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction: `You are a helpful assistant for a developer tool. The user will ask you to perform a task.\n        Based on your knowledge base of available tools, you must decide which function to call to satisfy the user's request.\n        If no specific tool seems appropriate, you can respond with text.\n        \n        Knowledge Base of Available Tools:\n        ${knowledgeBase}`, tools: [{ functionDeclarations }] } });
        const functionCalls: { name: string, args: any }[] = [];
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) { if (part.functionCall) { functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args }); } }
        return { text: response.text, functionCalls: functionCalls.length > 0 ? functionCalls : undefined };
    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) { throw new Error("Gemini API key not found."); }
    const body = { "contents": [{ "parts": [{ "text": prompt }] }], "generationConfig": { "responseModalities": ["TEXT", "IMAGE"] } };
    const MAX_RETRIES = 3; let lastError: Error | null = null;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!response.ok) { const errorText = await response.text(); throw new Error(`API request failed with status ${response.status}: ${errorText}`); }
            const data = await response.json();
            const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData && part.inlineData.mimeType.startsWith('image/'));
            if (imagePart && imagePart.inlineData.data) { return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`; }
            const textResponse = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
            if (textResponse) { throw new Error(`API returned text instead of an image: ${textResponse}`); }
            throw new Error("API response did not contain valid image data.");
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logError(lastError, { context: 'generateImageFetch', attempt: i + 1, prompt });
            console.warn(`Attempt ${i + 1} failed. Retrying in ${Math.pow(2, i)}s...`);
            if (i < MAX_RETRIES - 1) { await sleep(1000 * Math.pow(2, i)); }
        }
    }
    throw new Error(`Failed to generate image after ${MAX_RETRIES} attempts. The service may be busy or the prompt may have been blocked. Please try again with a different prompt. Last error: ${lastError?.message}`);
};

// --- DB Service ---
const DB_NAME = 'devcore-db';
const DB_VERSION = 1;
const STORE_NAME = 'generated-files';
interface DevCoreDB extends DBSchema { [STORE_NAME]: { key: string; value: GeneratedFile; indexes: { 'by-filePath': string }; }; }
const dbPromise = openDB<DevCoreDB>(DB_NAME, DB_VERSION, { upgrade(db) { const store = db.createObjectStore(STORE_NAME, { keyPath: 'filePath' }); store.createIndex('by-filePath', 'filePath'); } });
export const saveFile = async (file: GeneratedFile): Promise<void> => { const db = await dbPromise; await db.put(STORE_NAME, file); };
export const getAllFiles = async (): Promise<GeneratedFile[]> => { const db = await dbPromise; return db.getAll(STORE_NAME); };
export const clearAllFiles = async (): Promise<void> => { const db = await dbPromise; await db.clear(STORE_NAME); };

// --- File Utils ---
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = ''; const bytes = new Uint8Array(buffer); const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
};
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => { resolve(arrayBufferToBase64(reader.result as ArrayBuffer)); };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(blob);
    });
};
export const fileToBase64 = (file: File): Promise<string> => blobToBase64(file);
export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => { const base64 = arrayBufferToBase64(reader.result as ArrayBuffer); resolve(`data:${blob.type};base64,${base64}`); };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(blob);
    });
};
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

// --- Taxonomy Service ---
export interface FeatureTaxonomy { id: string; name: string; description: string; category: string; inputs: string; }
export const FEATURE_TAXONOMY: FeatureTaxonomy[] = [
    { id: "ai-command-center", name: "AI Command Center", description: "The main entry point. Use natural language to navigate and control the entire toolkit. Can call other tools.", category: "Core", inputs: "A natural language prompt describing what the user wants to do. Examples: 'explain this code: ...', 'design a theme with space vibes'." },
    { id: "ai-code-explainer", name: "AI Code Explainer", description: "Accepts a code snippet and provides a detailed, structured analysis including summary, line-by-line breakdown, time/space complexity, and suggestions for improvement.", category: "AI Tools", inputs: "A string containing a code snippet." },
    { id: "theme-designer", name: "AI Theme Designer", description: "Generates a complete UI color theme (primary, background, text colors) from a simple text description.", category: "AI Tools", inputs: "A string describing the desired aesthetic. Example: 'a calm, minimalist theme for a blog'." },
    { id: "regex-sandbox", name: "RegEx Sandbox", description: "Generates a regular expression from a natural language description. Also allows testing expressions against a string.", category: "Testing", inputs: "A string describing the pattern to match. Example: 'find all email addresses'." },
    { id: "pr-summary-generator", name: "AI PR Summary Generator", description: "Takes 'before' and 'after' code snippets, calculates the diff, and generates a structured pull request summary including a title, a prose description, and a bulleted list of changes.", category: "AI Tools", inputs: "Two strings: 'beforeCode' and 'afterCode'." },
    { id: "visual-git-tree", name: "AI Git Log Analyzer", description: "Intelligently parses a raw 'git log' output to create a categorized and well-formatted changelog, separating new features from bug fixes.", category: "Git", inputs: "A string containing the raw output of a 'git log' command." },
    { id: "cron-job-builder", name: "AI Cron Job Builder", description: "Generates a valid cron expression from a natural language description of a schedule.", category: "Deployment", inputs: "A string describing a schedule. Example: 'every weekday at 5pm'." },
    { id: "ai-code-migrator", name: "AI Code Migrator", description: "Translate code between languages & frameworks.", category: "AI Tools", inputs: "A string of code to convert, a string for the source language, and a string for the target language. e.g. 'migrate this SASS to CSS: ...'" },
    { id: "ai-commit-generator", name: "AI Commit Message Generator", description: "Generates a conventional commit message from a git diff.", category: "AI Tools", inputs: "A string containing a git diff." },
    { id: "worker-thread-debugger", name: "AI Concurrency Analyzer", description: "Analyzes JavaScript code for potential Web Worker concurrency issues like race conditions.", category: "Testing", inputs: "A string of JavaScript code to analyze for concurrency issues." },
    { id: "xbrl-converter", name: "XBRL Converter", description: "Converts a JSON object into a simplified XBRL-like XML format.", category: "Data", inputs: "A string containing valid JSON." }
];

// --- Component Loader ---
export const lazyWithRetry = <T extends React.ComponentType<any>>(componentImport: () => Promise<{ [key: string]: T }>, exportName: string) => {
    return lazy(async () => {
        const MAX_RETRIES = 3; const RETRY_DELAY_MS = 1000;
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const module = await componentImport();
                if (module[exportName]) { return { default: module[exportName] }; }
                throw new Error(`Named export '${exportName}' not found in module.`);
            } catch (error) {
                console.error(error);
                if (i < MAX_RETRIES - 1) { await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); } else {
                    console.error("Failed to load component after multiple retries. Reloading page.");
                    window.location.reload();
                    throw error;
                }
            }
        }
        throw new Error('Component failed to load and retries were exhausted.');
    });
};