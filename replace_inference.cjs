const fs = require('fs');
let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const regex = /export const getInferenceFunction = async \(.*?=> \{[\s\S]*?catch \(error\) \{[\s\S]*?\}\n\};\n/m;

const replacement = `export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    try {
        const response = await fetch('/api/gemini/inference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, functionDeclarations, knowledgeBase })
        });
        if (!response.ok) {
            throw new Error(\`Server returned \${response.status}: \${await response.text()}\`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error inferring function call:", error);
        logError(error as Error, { prompt });
        throw new Error("The AI assistant could not process your request.");
    }
};\n`;

if (!regex.test(content)) {
    console.error("Could not find getInferenceFunction block.");
    process.exit(1);
}

content = content.replace(regex, replacement);
fs.writeFileSync('src/services/geminiService.ts', content);
