import { Type, GenerateContentResponse, FunctionDeclaration, FunctionCall, Part } from "@google/genai";
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
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
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
            const lines = buffer.split('\n\n');
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
            yield `An error occurred while communicating with the AI model: ${error.message}`;
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
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
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
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error generating JSON from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

export const debugErrorStream = (error: Error) => streamContent(
    `An error occurred in my web application. Please provide a brief explanation of the error and a possible solution.
    
    Error Message: ${error.message}
    
    Stack Trace:
    ${error.stack}
    `,
    "You are a helpful AI debugging assistant. Explain the error in simple terms and suggest a fix. Format your response as markdown."
);

const structuredExplanationSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: 'A high-level summary of what the code does.' },
        lineByLine: {
            type: Type.ARRAY,
            description: 'A line-by-line explanation of the code.',
            items: {
                type: Type.OBJECT,
                properties: {
                    lines: { type: Type.STRING, description: 'The line number or range (e.g., "1-5").' },
                    explanation: { type: Type.STRING, description: 'The explanation for that line/range.' }
                },
                required: ['lines', 'explanation']
            }
        },
        complexity: {
            type: Type.OBJECT,
            description: 'The computational complexity of the code.',
            properties: {
                time: { type: Type.STRING, description: 'The time complexity (e.g., "O(n^2)").' },
                space: { type: Type.STRING, description: 'The space complexity (e.g., "O(1)").' }
            },
            required: ['time', 'space']
        },
        suggestions: {
            type: Type.ARRAY,
            description: 'A list of suggestions for improving the code.',
            items: { type: Type.STRING }
        }
    },
    required: ['summary', 'lineByLine', 'complexity', 'suggestions']
};

export const explainCodeStructured = (code: string): Promise<StructuredExplanation> => generateJson<StructuredExplanation>(
    `Provide a structured analysis of the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer providing a detailed, structured analysis of code. Respond in the requested JSON format.",
    structuredExplanationSchema
);


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

export const enhanceSnippetStream = (code: string) => streamContent(
    `Enhance the following code snippet by adding comments, improving clarity, or refactoring for better performance. Respond with only the enhanced code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer who improves and refactors code snippets."
);

export const generateCodingChallengeStream = (_: any) => streamContent(
    `Generate a new, interesting coding challenge suitable for an intermediate developer. Include a title, a clear problem description, an example, and any constraints.`,
    "You are an AI assistant that creates coding challenges for software developers.",
    0.9
);

export const reviewCodeStream = (code: string) => streamContent(
    `Please provide a concise code review for the following snippet. Focus on potential bugs, performance issues, and adherence to best practices. Format the response as markdown with sections for "Suggestions" and "Concerns".\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer performing a code review."
);

export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(
    `Translate the following code from ${from} to ${to}. Respond with only the translated code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    `You are an expert programmer specializing in migrating code between languages and frameworks. You only output the translated code.`
);

export const analyzeConcurrencyStream = (code: string) => streamContent(
    `Analyze the following JavaScript code for potential concurrency issues related to Web Workers, such as race conditions or deadlocks. Provide a report explaining any found issues and suggest solutions.\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are a senior software engineer specializing in concurrent programming in JavaScript."
);

export const convertJsonToXbrlStream = (json: string) => streamContent(
    `You are an expert in financial data formats. Convert the following JSON object into a standards-compliant XBRL XML document. Infer appropriate namespaces and element tags based on common financial reporting schemas like US-GAAP if applicable. Respond with only the valid XML content in a markdown block.\n\nJSON:\n${json}`,
    "You are an expert in data formats. You convert JSON to a standards-compliant XBRL-style XML. You only output valid XML."
);

export const generateChangelogFromLogStream = (log: string) => streamContent(
    `Generate a categorized and well-formatted changelog in markdown from the following raw git log output. Separate new features from bug fixes.\n\nGit Log:\n${log}`,
    "You are an AI assistant that creates clean and readable changelogs from git history."
);

export const generateMockDataStream = (prompt: string) => streamContent(
    `Generate mock data based on the following description. Respond with only the data in a markdown JSON block.\n\nDescription: ${prompt}`,
    "You are an expert in generating realistic mock data in JSON format."
);

export const generateSqlQueryStream = (schema: string, prompt: string) => streamContent(
    `Generate a single, valid SQL query based on the provided schema and natural language request. Respond with only the SQL query in a markdown block.\n\nSchema:\n${schema}\n\nRequest: ${prompt}`,
    "You are an expert SQL developer. You only output valid SQL queries."
);

export const analyzeAccessibilityStream = (html: string) => streamContent(
    `Analyze the following HTML snippet for accessibility (a11y) issues according to WCAG 2.1 AA standards. Provide a report in markdown format, detailing any findings and suggesting remediations.\n\nHTML:\n\`\`\`html\n${html}\n\`\`\``,
    "You are an accessibility expert specializing in web development."
);

export const generateFlowchartStream = (code: string) => streamContent(
    `Generate a Mermaid.js flowchart diagram script that represents the logic of the following code. Respond with only the script in a markdown mermaid block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert in software logic and Mermaid.js diagrams. You only output valid Mermaid.js scripts."
);

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        return data.image;
    } catch (error) {
        console.error("Error generating image:", error);
        logError(error as Error, { prompt });
        throw new Error("Could not generate image.");
    }
};

// --- Unified Feature Functions (JSON) ---

const prSummarySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A conventional commit style title for the pull request.' },
        summary: { type: Type.STRING, description: 'A one-paragraph summary of the changes.' },
        changes: {
            type: Type.ARRAY,
            description: 'A bulleted list of the key changes.',
            items: { type: Type.STRING }
        }
    },
    required: ['title', 'summary', 'changes']
};


export const summarizeNotesStream = (notes: string) => streamContent(
    `Summarize the following meeting notes into key takeaways and action items.\n\nNotes:\n${notes}`,
    "You are an expert executive assistant."
);
export const generateJsonSchemaStream = (json: string) => streamContent(
    `Generate a JSON Schema for the following JSON object.\n\nJSON:\n${json}`,
    "You are a data architect specializing in JSON Schema."
);
export const formatSqlStream = (sql: string) => streamContent(
    `Format the following SQL query to be highly readable.\n\nSQL:\n${sql}`,
    "You are a DBA who writes perfectly formatted SQL."
);
export const generateUmlDiagramStream = (description: string) => streamContent(
    `Generate a PlantUML diagram based on this description.\n\nDescription:\n${description}`,
    "You are a software architect who creates clear UML diagrams."
);
export const scrapeHtmlStream = (html: string, prompt: string) => streamContent(
    `Extract information from this HTML based on the prompt.\n\nPrompt: ${prompt}\n\nHTML:\n${html}`,
    "You are a data extraction bot."
);
export const generateUserStoriesStream = (description: string) => streamContent(
    `Generate Agile user stories with acceptance criteria based on this feature description.\n\nFeature:\n${description}`,
    "You are an expert Product Manager."
);
export const designSystemStream = (description: string) => streamContent(
    `Design a system architecture for this application description.\n\nApp:\n${description}`,
    "You are a Principal Cloud Architect."
);
export const generateTerraformConfigStream = (description: string) => streamContent(
    `Generate Terraform HCL code for this infrastructure description.\n\nInfra:\n${description}`,
    "You are an expert DevOps engineer specializing in Terraform."
);
export const generateKubernetesManifestStream = (description: string) => streamContent(
    `Generate a Kubernetes YAML manifest for this deployment description.\n\nDeploy:\n${description}`,
    "You are a Kubernetes expert."
);
export const generateRoadmapStream = (goals: string) => streamContent(
    `Generate a product roadmap based on these goals.\n\nGoals:\n${goals}`,
    "You are a strategic Product Manager."
);
export const generateProjectTimelineStream = (description: string) => streamContent(
    `Create a project timeline with milestones for this project.\n\nProject:\n${description}`,
    "You are a seasoned Project Manager."
);
export const suggestDesignPatternsStream = (problem: string) => streamContent(
    `Suggest software design patterns to solve this problem.\n\nProblem:\n${problem}`,
    "You are a Software Architect expert in Gang of Four design patterns."
);
export const generateLandingPageStream = (description: string) => streamContent(
    `Generate HTML/CSS for a landing page based on this description.\n\nDescription:\n${description}`,
    "You are an expert Frontend Developer."
);
export const generateDocumentationStream = (code: string) => streamContent(
    `Generate comprehensive markdown documentation for the following code.\n\nCode:\n${code}`,
    "You are a Technical Writer."
);
export const generateCodeCommentsStream = (code: string) => streamContent(
    `Add comments to the following code.\n\nCode:\n${code}`,
    "You are a helpful AI programming assistant."
);
export const explainErrorStream = (error: string) => streamContent(
    `Explain this error message and stack trace.\n\nError:\n${error}`,
    "You are an expert debugger."
);
export const generateReleaseNotesStream = (commits: string, version: string) => streamContent(
    `Generate release notes for version ${version} from these commits.\n\nCommits:\n${commits}`,
    "You are an AI assistant that writes release notes."
);
export const suggestDependencyUpdatesStream = (packageJson: string) => streamContent(
    `Suggest updates for this package.json.\n\nPackage.json:\n${packageJson}`,
    "You are an expert JavaScript developer."
);
export const generateApiFromSnippetStream = (code: string, description: string) => streamContent(
    `Create a Node.js Express API endpoint.\n\nDesc: ${description}\n\nCode:\n${code}`,
    "You are an expert backend developer."
);
export const generateSdkFromApiSpecStream = (spec: string, language: string) => streamContent(
    `Generate a client SDK in ${language} for this OpenAPI spec.\n\nSpec:\n${spec}`,
    "You are an API developer."
);
export const analyzeCodePerformanceStream = (code: string) => streamContent(
    `Analyze performance bottlenecks in this code.\n\nCode:\n${code}`,
    "You are a performance optimization expert."
);
export const analyzeDependenciesStream = (packageJson: string) => streamContent(
    `Analyze these dependencies for bloat or alternatives.\n\nPackage.json:\n${packageJson}`,
    "You are an npm ecosystem expert."
);
export const scanCodeForVulnerabilitiesStream = (code: string) => streamContent(
    `Scan this code for security vulnerabilities.\n\nCode:\n${code}`,
    "You are a security expert."
);
export const generateInterviewQuestionsStream = (topic: string) => streamContent(
    `Generate interview questions for: ${topic}`,
    "You are an engineering manager."
);
export const generateTechBlogPostStream = (topic: string) => streamContent(
    `Write a technical blog post about: ${topic}`,
    "You are a Developer Advocate."
);
export const generateProfileReadmeStream = (about: string) => streamContent(
    `Generate a GitHub profile README for:\n\n${about}`,
    "You are a creative developer."
);
export const generateDockerfileStream = (description: string) => streamContent(
    `Generate a Dockerfile for:\n\n${description}`,
    "You are a DevOps expert."
);
export const generateCiCdPipelineStream = (description: string, provider: string) => streamContent(
    `Generate a CI/CD pipeline for ${provider}.\n\nProcess:\n${description}`,
    "You are a DevOps automation expert."
);
export const estimateCloudCostStream = (description: string) => streamContent(
    `Estimate cloud costs for this infrastructure:\n\n${description}`,
    "You are a FinOps expert."
);
export const generateApiDocsStream = (code: string) => streamContent(
    `Generate API documentation for this code:\n\n${code}`,
    "You are a technical writer."
);
export const generateChatbotSystemPromptStream = (knowledgeBase: string) => streamContent(
    `Create a chatbot system prompt based on this knowledge base:\n\n${knowledgeBase}`,
    "You are a prompt engineer."
);
export const compileSassStream = (scss: string) => streamContent(
    `Convert this SCSS to CSS.\n\nSCSS:\n${scss}`,
    "You are a SASS/SCSS compiler."
);

export const parseCertificateDetails = (pem: string): Promise<CertificateDetails> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            subject: { type: Type.OBJECT, properties: { commonName: {type: Type.STRING}, organization: {type: Type.STRING}, country: {type: Type.STRING} }, required: ['commonName'] },
            issuer: { type: Type.OBJECT, properties: { commonName: {type: Type.STRING}, organization: {type: Type.STRING}, country: {type: Type.STRING} }, required: ['commonName'] },
            validFrom: { type: Type.STRING },
            validTo: { type: Type.STRING },
            serialNumber: { type: Type.STRING }
        },
        required: ["subject", "issuer", "validFrom", "validTo", "serialNumber"]
    };
    return generateJson<CertificateDetails>(`Parse this certificate:\n${pem}`, "You are a security expert.", schema);
};

export const generateDriveLabelRequest = (prompt: string): Promise<any> => {
    return generateJson<any>(`Generate drive label request for: ${prompt}`, "You are a google drive expert.", { type: Type.OBJECT, properties: {}, additionalProperties: true });
};

export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => generateJson<StructuredPrSummary>(
    `Generate a structured pull request summary for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``,
    "You are an expert programmer who writes excellent pull request summaries. Respond in the requested JSON format.",
    prSummarySchema
);

const themeSchema = {
    type: Type.OBJECT,
    properties: {
        primary: { type: Type.STRING, description: 'The primary accent color (hex code).' },
        background: { type: Type.STRING, description: 'The main background color (hex code).' },
        surface: { type: Type.STRING, description: 'The color for surfaces like cards (hex code).' },
        textPrimary: { type: Type.STRING, description: 'The color for primary text (hex code).' },
        textSecondary: { type: Type.STRING, description: 'The color for secondary text (hex code).' }
    },
    required: ['primary', 'background', 'surface', 'textPrimary', 'textSecondary']
};

export const generateThemeFromDescription = (description: string): Promise<ColorTheme> => generateJson<ColorTheme>(
    `Generate a color theme based on this description: "${description}"`,
    "You are a UI designer who creates beautiful, accessible color palettes. Respond in the requested JSON format.",
    themeSchema
);

const repoDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'A short, URL-friendly repository name in kebab-case.' },
        description: { type: Type.STRING, description: 'A concise, one-sentence description of the repository.' }
    },
    required: ['name', 'description']
};

export const generateRepoDetailsFromPrompt = (prompt: string): Promise<RepoTemplate> => generateJson<RepoTemplate>(
    `Generate a repository name and description for a project with the following goal: "${prompt}"`,
    "You are an expert software project manager. You create clear and concise repository names and descriptions. Respond in the requested JSON format.",
    repoDetailsSchema
);

export interface CronParts {
    minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string;
}

const cronSchema = {
    type: Type.OBJECT,
    properties: {
        minute: { type: Type.STRING },
        hour: { type: Type.STRING },
        dayOfMonth: { type: Type.STRING },
        month: { type: Type.STRING },
        dayOfWeek: { type: Type.STRING }
    },
    required: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
};

export const generateCronFromDescription = (description: string): Promise<CronParts> => generateJson<CronParts>(
    `Generate a cron expression based on this description: "${description}"`,
    "You are an expert in cron expressions. Respond with only the requested JSON object.",
    cronSchema
);

const paletteSchema = {
    type: Type.OBJECT,
    properties: {
        colors: {
            type: Type.ARRAY,
            description: 'An array of 6 hex color codes, from darkest to lightest.',
            items: { type: Type.STRING }
        }
    },
    required: ['colors']
};

export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => generateJson<{ colors: string[] }>(
    `Generate a 6-color palette based on the color ${baseColor}.`,
    "You are a UI designer who creates beautiful, harmonious color palettes. Respond in the requested JSON format.",
    paletteSchema
);

export const generateFeature = async (prompt: string): Promise<GeneratedFile[]> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            files: {
                type: Type.ARRAY,
                description: 'An array of files to be created.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        filePath: { type: Type.STRING, description: 'The full path of the file, e.g., "src/components/MyComponent.tsx".' },
                        content: { type: Type.STRING, description: 'The complete code or content of the file.' },
                        description: { type: Type.STRING, description: 'A brief, one-sentence description of the file\'s purpose.' }
                    },
                    required: ['filePath', 'content', 'description']
                }
            }
        },
        required: ['files']
    };
    
    const result = await generateJson<{ files: GeneratedFile[] }>(
        `Generate all the necessary files for a new feature based on the following description. The main component should be a React component using TypeScript and functional components. Include a .tsx file for the component and a .css file if needed.
        
        Description: "${prompt}"`,
        "You are an expert full-stack software engineer who builds complete features. You respond only with the requested JSON object containing an array of files.",
        schema
    );
    return result.files;
};
export interface CommandResponse {
    functionCalls?: FunctionCall[];
    text?: string;
}

export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    try {
        const response = await fetch('/api/gemini/inference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, functionDeclarations, knowledgeBase })
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error inferring function call:", error);
        logError(error as Error, { prompt });
        throw new Error("The AI assistant could not process your request.");
    }
};
