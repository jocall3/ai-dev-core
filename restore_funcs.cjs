const fs = require('fs');
let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const funcsToAdd = `
export const summarizeNotesStream = (notes: string) => streamContent(
    \`Summarize the following meeting notes into key takeaways and action items.\\n\\nNotes:\\n\${notes}\`,
    "You are an expert executive assistant."
);
export const generateJsonSchemaStream = (json: string) => streamContent(
    \`Generate a JSON Schema for the following JSON object.\\n\\nJSON:\\n\${json}\`,
    "You are a data architect specializing in JSON Schema."
);
export const formatSqlStream = (sql: string) => streamContent(
    \`Format the following SQL query to be highly readable.\\n\\nSQL:\\n\${sql}\`,
    "You are a DBA who writes perfectly formatted SQL."
);
export const generateUmlDiagramStream = (description: string) => streamContent(
    \`Generate a PlantUML diagram based on this description.\\n\\nDescription:\\n\${description}\`,
    "You are a software architect who creates clear UML diagrams."
);
export const scrapeHtmlStream = (html: string, prompt: string) => streamContent(
    \`Extract information from this HTML based on the prompt.\\n\\nPrompt: \${prompt}\\n\\nHTML:\\n\${html}\`,
    "You are a data extraction bot."
);
export const generateUserStoriesStream = (description: string) => streamContent(
    \`Generate Agile user stories with acceptance criteria based on this feature description.\\n\\nFeature:\\n\${description}\`,
    "You are an expert Product Manager."
);
export const designSystemStream = (description: string) => streamContent(
    \`Design a system architecture for this application description.\\n\\nApp:\\n\${description}\`,
    "You are a Principal Cloud Architect."
);
export const generateTerraformConfigStream = (description: string) => streamContent(
    \`Generate Terraform HCL code for this infrastructure description.\\n\\nInfra:\\n\${description}\`,
    "You are an expert DevOps engineer specializing in Terraform."
);
export const generateKubernetesManifestStream = (description: string) => streamContent(
    \`Generate a Kubernetes YAML manifest for this deployment description.\\n\\nDeploy:\\n\${description}\`,
    "You are a Kubernetes expert."
);
export const generateRoadmapStream = (goals: string) => streamContent(
    \`Generate a product roadmap based on these goals.\\n\\nGoals:\\n\${goals}\`,
    "You are a strategic Product Manager."
);
export const generateProjectTimelineStream = (description: string) => streamContent(
    \`Create a project timeline with milestones for this project.\\n\\nProject:\\n\${description}\`,
    "You are a seasoned Project Manager."
);
export const suggestDesignPatternsStream = (problem: string) => streamContent(
    \`Suggest software design patterns to solve this problem.\\n\\nProblem:\\n\${problem}\`,
    "You are a Software Architect expert in Gang of Four design patterns."
);
export const generateLandingPageStream = (description: string) => streamContent(
    \`Generate HTML/CSS for a landing page based on this description.\\n\\nDescription:\\n\${description}\`,
    "You are an expert Frontend Developer."
);
export const generateDocumentationStream = (code: string) => streamContent(
    \`Generate comprehensive markdown documentation for the following code.\\n\\nCode:\\n\${code}\`,
    "You are a Technical Writer."
);
export const generateCodeCommentsStream = (code: string) => streamContent(
    \`Add comments to the following code.\\n\\nCode:\\n\${code}\`,
    "You are a helpful AI programming assistant."
);
export const explainErrorStream = (error: string) => streamContent(
    \`Explain this error message and stack trace.\\n\\nError:\\n\${error}\`,
    "You are an expert debugger."
);
export const generateReleaseNotesStream = (commits: string, version: string) => streamContent(
    \`Generate release notes for version \${version} from these commits.\\n\\nCommits:\\n\${commits}\`,
    "You are an AI assistant that writes release notes."
);
export const suggestDependencyUpdatesStream = (packageJson: string) => streamContent(
    \`Suggest updates for this package.json.\\n\\nPackage.json:\\n\${packageJson}\`,
    "You are an expert JavaScript developer."
);
export const generateApiFromSnippetStream = (code: string, description: string) => streamContent(
    \`Create a Node.js Express API endpoint.\\n\\nDesc: \${description}\\n\\nCode:\\n\${code}\`,
    "You are an expert backend developer."
);
export const generateSdkFromApiSpecStream = (spec: string, language: string) => streamContent(
    \`Generate a client SDK in \${language} for this OpenAPI spec.\\n\\nSpec:\\n\${spec}\`,
    "You are an API developer."
);
export const analyzeCodePerformanceStream = (code: string) => streamContent(
    \`Analyze performance bottlenecks in this code.\\n\\nCode:\\n\${code}\`,
    "You are a performance optimization expert."
);
export const analyzeDependenciesStream = (packageJson: string) => streamContent(
    \`Analyze these dependencies for bloat or alternatives.\\n\\nPackage.json:\\n\${packageJson}\`,
    "You are an npm ecosystem expert."
);
export const scanCodeForVulnerabilitiesStream = (code: string) => streamContent(
    \`Scan this code for security vulnerabilities.\\n\\nCode:\\n\${code}\`,
    "You are a security expert."
);
export const generateInterviewQuestionsStream = (topic: string) => streamContent(
    \`Generate interview questions for: \${topic}\`,
    "You are an engineering manager."
);
export const generateTechBlogPostStream = (topic: string) => streamContent(
    \`Write a technical blog post about: \${topic}\`,
    "You are a Developer Advocate."
);
export const generateProfileReadmeStream = (about: string) => streamContent(
    \`Generate a GitHub profile README for:\\n\\n\${about}\`,
    "You are a creative developer."
);
export const generateDockerfileStream = (description: string) => streamContent(
    \`Generate a Dockerfile for:\\n\\n\${description}\`,
    "You are a DevOps expert."
);
export const generateCiCdPipelineStream = (description: string, provider: string) => streamContent(
    \`Generate a CI/CD pipeline for \${provider}.\\n\\nProcess:\\n\${description}\`,
    "You are a DevOps automation expert."
);
export const estimateCloudCostStream = (description: string) => streamContent(
    \`Estimate cloud costs for this infrastructure:\\n\\n\${description}\`,
    "You are a FinOps expert."
);
export const generateApiDocsStream = (code: string) => streamContent(
    \`Generate API documentation for this code:\\n\\n\${code}\`,
    "You are a technical writer."
);
export const generateChatbotSystemPromptStream = (knowledgeBase: string) => streamContent(
    \`Create a chatbot system prompt based on this knowledge base:\\n\\n\${knowledgeBase}\`,
    "You are a prompt engineer."
);
export const compileSassStream = (scss: string) => streamContent(
    \`Convert this SCSS to CSS.\\n\\nSCSS:\\n\${scss}\`,
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
    return generateJson<CertificateDetails>(\`Parse this certificate:\\n\${pem}\`, "You are a security expert.", schema);
};

export const generateDriveLabelRequest = (prompt: string): Promise<any> => {
    return generateJson<any>(\`Generate drive label request for: \${prompt}\`, "You are a google drive expert.", { type: Type.OBJECT, properties: {}, additionalProperties: true });
};
`;

const insertIndex = content.indexOf('export const generatePrSummaryStructured');
content = content.substring(0, insertIndex) + funcsToAdd + "\n" + content.substring(insertIndex);

fs.writeFileSync('src/services/geminiService.ts', content);
