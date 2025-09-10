import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration, FunctionCall, Part } from "@google/genai";
import type { GeneratedFile, StructuredPrSummary, StructuredExplanation, ColorTheme, RepoTemplate } from '../types.ts';
import { logError } from './telemetryService.ts';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API key not found. Please set the API_KEY environment variable.");
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
    `Convert the following JSON object into a simplified XBRL-like XML format. Respond with only the XML content, without any markdown formatting.\n\nJSON:\n${json}`,
    "You are an expert in data formats. You convert JSON to a simplified, human-readable XBRL-style XML. You only output valid XML."
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
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        logError(error as Error, { prompt });
        throw error;
    }
}

export const summarizeNotesStream = (notes: string) => streamContent(
    `Summarize the key points and action items from these notes:\n\n${notes}`,
    "You are a helpful assistant that summarizes notes into a concise, actionable list."
);

export const generateJsonSchemaStream = (json: string) => streamContent(
    `Generate a JSON Schema for the following JSON object. Respond with only the schema in a markdown JSON block.\n\n${json}`,
    "You are an expert in data modeling. You only output valid JSON Schema."
);

export const formatSqlStream = (sql: string) => streamContent(
    `Format the following SQL query. Respond with only the formatted query in a markdown SQL block.\n\n${sql}`,
    "You are an expert SQL formatter. You only output formatted SQL."
);

export const generateUmlDiagramStream = (description: string) => streamContent(
    `Generate a Mermaid.js diagram script for the following description. Respond with only the script in a markdown mermaid block.\n\nDescription: "${description}"`,
    "You are an expert in software architecture and Mermaid.js diagrams. You only output valid Mermaid.js scripts."
);

export const scrapeHtmlStream = (html: string, prompt: string) => streamContent(
    `From the following HTML, ${prompt}. Respond with only the requested data.\n\nHTML:\n${html}`,
    "You are an expert web scraper. You extract data from HTML as requested by the user."
);

export const generateUserStoriesStream = (description: string) => streamContent(
    `Generate a list of user stories in the "As a [user type], I want to [action], so that [benefit]" format based on this feature description. Include acceptance criteria for each story.\n\nDescription: ${description}`,
    "You are an expert product manager who writes clear and concise user stories."
);

export const designSystemStream = (description: string) => streamContent(
    `Create a high-level system design for the following application. Include components, data models, and potential technologies. Format it as a markdown document.\n\nApplication: ${description}`,
    "You are a principal software architect designing scalable and robust systems."
);

export const generateTerraformConfigStream = (description: string) => streamContent(
    `Generate a Terraform HCL configuration for the following infrastructure description. Respond with only the HCL code in a markdown block.\n\nDescription: ${description}`,
    "You are a DevOps expert specializing in Terraform. You only output valid HCL code."
);

export const generateKubernetesManifestStream = (description: string) => streamContent(
    `Generate a Kubernetes manifest (YAML) for the following service description. Respond with only the YAML in a markdown block.\n\nDescription: ${description}`,
    "You are a DevOps expert specializing in Kubernetes. You only output valid Kubernetes YAML."
);

export const generateRoadmapStream = (goals: string) => streamContent(
    `Create a product roadmap in markdown based on these goals. Organize it by quarters or phases and include key features for each.\n\nGoals: ${goals}`,
    "You are an experienced product manager who creates clear and strategic product roadmaps."
);

export const generateProjectTimelineStream = (description: string) => streamContent(
    `Create a project timeline in markdown based on this description. Break it down into phases (e.g., Week 1-2, Month 1) and list key tasks for each.\n\nProject: ${description}`,
    "You are an experienced project manager."
);

export const suggestDesignPatternsStream = (problem: string) => streamContent(
    `Based on the following software design problem, suggest one or two relevant design patterns. For each, explain what it is and why it's a good fit.\n\nProblem: ${problem}`,
    "You are a senior software architect with deep knowledge of Gang of Four design patterns."
);

export const generateLandingPageStream = (description: string) => streamContent(
    `Generate a complete, single-file HTML landing page for the following product. Include inline CSS for styling. Respond with only the HTML code in a markdown block.\n\nProduct: ${description}`,
    "You are an expert web developer specializing in creating beautiful and effective landing pages."
);

export const generateDocumentationStream = (code: string) => streamContent(
    `Generate comprehensive markdown documentation for the following code. Include sections for the overall purpose, parameters/props, return values, and a usage example.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are a technical writer who creates clear and helpful documentation for software developers."
);

export const generateCodeCommentsStream = (code: string) => streamContent(
    `Add comments to the following code to explain what it does. Respond with the complete, commented code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a helpful AI programming assistant that writes clear, concise comments for code."
);

export const explainErrorStream = (error: string) => streamContent(
    `Explain this error message and stack trace. What is the likely cause, and how can I fix it?\n\n${error}`,
    "You are an expert debugger who helps programmers understand and solve errors."
);

export const generateReleaseNotesStream = (commits: string, version: string) => streamContent(
    `Generate markdown-formatted release notes for version ${version} from the following list of commit messages. Group them into sections like "New Features", "Bug Fixes", and "Other Changes".\n\nCommits:\n${commits}`,
    "You are an AI assistant that helps write clear and organized release notes."
);

export const suggestDependencyUpdatesStream = (packageJson: string) => streamContent(
    `I have the following package.json file. For each dependency, check if there's a newer version available and suggest whether to update. Provide a brief summary of what's new in major version updates.\n\n${packageJson}`,
    "You are an AI assistant that helps developers manage their dependencies."
);

export const generateApiFromSnippetStream = (code: string, description: string) => streamContent(
    `Create a simple Node.js Express API endpoint that uses the following code snippet. The API should behave as described.\n\nDescription: ${description}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert backend developer who creates Node.js and Express APIs."
);

export const generateSdkFromApiSpecStream = (spec: string, language: string) => streamContent(
    `Generate a client SDK in ${language} for the following OpenAPI specification. Respond with only the code in a markdown block.\n\nSpec:\n${spec}`,
    "You are an AI assistant that generates client SDKs from OpenAPI specifications."
);

export const analyzeCodePerformanceStream = (code: string) => streamContent(
    `Analyze the performance of the following code. Identify any bottlenecks or areas for optimization and suggest specific improvements.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer specializing in code performance and optimization."
);

export const analyzeDependenciesStream = (packageJson: string) => streamContent(
    `Analyze the dependencies in this package.json file. For each dependency, provide a brief description of what it does. Also, highlight any dependencies that might be unusually large or have known alternatives.\n\n${packageJson}`,
    "You are a senior developer with a broad knowledge of the npm ecosystem."
);

export const scanCodeForVulnerabilitiesStream = (code: string) => streamContent(
    `Scan the following code for common security vulnerabilities (like SQL injection, XSS, etc.). Provide a report in markdown format, detailing any findings and suggesting remediations.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a security expert specializing in static code analysis."
);

export const generateInterviewQuestionsStream = (topic: string) => streamContent(
    `Generate a list of 5-7 common interview questions and their answers for a software engineering role, focusing on the topic of "${topic}".`,
    "You are an experienced engineering manager who conducts technical interviews."
);

export const generateTechBlogPostStream = (topic: string) => streamContent(
    `Write a draft for a technical blog post on the topic: "${topic}". Include an introduction, a main body with code examples where appropriate, and a conclusion. Format as markdown.`,
    "You are a skilled technical writer and developer advocate."
);

export const generateProfileReadmeStream = (about: string) => streamContent(
    `Generate a cool and professional GitHub profile README.md file for a developer with the following description. Use markdown, add some flair with badges or emojis.\n\nAbout the user: ${about}`,
    "You are a creative developer who knows how to make a great GitHub profile."
);

export const generateDockerfileStream = (description: string) => streamContent(
    `Generate a production-ready, multi-stage Dockerfile for the following application description. Respond with only the Dockerfile content in a markdown block.\n\nApplication: ${description}`,
    "You are a DevOps expert specializing in containerization with Docker."
);

export const generateCiCdPipelineStream = (description: string, provider: string) => streamContent(
    `Generate a CI/CD pipeline configuration in YAML for ${provider} based on the following process. Respond with only the YAML code in a markdown block.\n\nProcess: ${description}`,
    "You are a DevOps expert specializing in CI/CD automation."
);

export const estimateCloudCostStream = (description: string) => streamContent(
    `Provide a high-level, estimated monthly cost breakdown for the following cloud infrastructure, assuming it's hosted on a major cloud provider like AWS or GCP. Provide the response in markdown.\n\nInfrastructure: ${description}`,
    "You are a cloud cost optimization expert. You provide high-level estimates to help with budgeting."
);

export const generateApiDocsStream = (code: string) => streamContent(
    `Generate API documentation in markdown format for the following API endpoint code. Include the endpoint, HTTP method, parameters, and example request/response.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a technical writer who specializes in creating clear API documentation."
);

export const generateChatbotSystemPromptStream = (knowledgeBase: string) => streamContent(
    `Based on the following knowledge base, create a concise and effective "system prompt" for a customer support chatbot. The prompt should instruct the AI to be helpful, friendly, and to only answer questions based on the provided text.\n\nKnowledge Base:\n${knowledgeBase}`,
    "You are an expert in designing prompts for large language models."
);

// --- Unified Feature Functions (JSON) ---

export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: `You are the AI command center for a developer toolkit. Your goal is to understand the user's request and call the appropriate function to activate a tool. Use the provided knowledge base to understand what each tool does before making a function call. If the user's request is a general question or doesn't map to a specific tool, respond with a helpful text answer.\n\nKnowledge Base:\n${knowledgeBase}`,
                tools: [{ functionDeclarations }],
            }
        });

        const functionCalls = response.candidates?.[0]?.content?.parts?.reduce<FunctionCall[]>((acc, part) => {
            if ('functionCall' in part && part.functionCall) {
                acc.push(part.functionCall);
            }
            return acc;
        }, []) ?? [];

        return { text: response.text, functionCalls };
        
    } catch (error) {
        console.error("Error inferring function:", error);
        logError(error as Error, { prompt });
        throw error;
    }
}

export const generateFeature = (prompt: string): Promise<GeneratedFile[]> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            files: {
                type: Type.ARRAY,
                description: "An array of files to be generated for the feature.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        filePath: { type: Type.STRING, description: "The full path for the file, e.g., 'src/components/MyComponent.tsx'." },
                        content: { type: Type.STRING, description: "The complete code or content for the file." },
                        description: { type: Type.STRING, description: "A brief description of what this file does." }
                    },
                    required: ["filePath", "content", "description"]
                }
            }
        },
        required: ["files"]
    };

    return generateJson<{ files: GeneratedFile[] }>(
        `Generate the necessary files for the following feature: "${prompt}"`,
        "You are an expert software engineer who generates complete, production-ready code files based on a feature description.",
        schema
    ).then(response => response.files);
};

export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A concise, conventional commit style title for the pull request." },
            summary: { type: Type.STRING, description: "A one-paragraph summary of the changes." },
            changes: {
                type: Type.ARRAY,
                description: "A bulleted list of the key changes.",
                items: { type: Type.STRING }
            }
        },
        required: ["title", "summary", "changes"]
    };
    return generateJson<StructuredPrSummary>(
        `Generate a structured pull request summary for the following diff:\n\n${diff}`,
        "You are an expert programmer who writes excellent pull request summaries.",
        schema
    );
};

export const generateThemeFromDescription = (description: string): Promise<ColorTheme> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            primary: { type: Type.STRING, description: "The primary accent color (e.g., for buttons)." },
            background: { type: Type.STRING, description: "The main page background color." },
            surface: { type: Type.STRING, description: "The color for card backgrounds or surfaces on top of the main background." },
            textPrimary: { type: Type.STRING, description: "The color for primary text like headings." },
            textSecondary: { type: Type.STRING, description: "The color for secondary text like descriptions." }
        },
        required: ["primary", "background", "surface", "textPrimary", "textSecondary"]
    };
    return generateJson<ColorTheme>(
        `Generate a UI color theme based on this description: "${description}"`,
        "You are a UI/UX designer specializing in color theory. You only output valid hex color codes in the requested JSON format.",
        schema
    );
};

export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            colors: {
                type: Type.ARRAY,
                description: "An array of 6 hex color codes, including the base color, that form a harmonious palette.",
                items: { type: Type.STRING }
            }
        },
        required: ["colors"]
    };
    return generateJson<{ colors: string[] }>(
        `Generate a 6-color palette based on the color ${baseColor}.`,
        "You are an expert color designer. You create beautiful, harmonious color palettes based on a single color.",
        schema
    );
}

export const generateRepoDetailsFromPrompt = (prompt: string): Promise<RepoTemplate> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "A short, descriptive, URL-friendly name for the repository (e.g., 'recipe-app')." },
            description: { type: Type.STRING, description: "A one-sentence description of the repository." }
        },
        required: ["name", "description"]
    };
    return generateJson<RepoTemplate>(
        `Generate a repository name and description for the following project idea: "${prompt}"`,
        "You are a helpful assistant for developers. You create concise and clear repository names and descriptions.",
        schema
    );
};

export interface CronParts {
    minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string;
}
export const generateCronFromDescription = (description: string): Promise<CronParts> => {
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
    return generateJson<CronParts>(
        `Generate a cron expression from this description: "${description}"`,
        "You are an expert in cron expressions. You only output the requested JSON.",
        schema
    );
};

// --- For AI Command Center ---
export interface CommandResponse {
    text: string;
    functionCalls?: FunctionCall[];
}