const fs = require('fs');
let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const regex = /export const generateImage = async \(prompt: string\): Promise<string> => \{[\s\S]*?catch \(error\) \{[\s\S]*?\}\n\};\n/m;

const replacement = `export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            throw new Error(\`Server returned \${response.status}: \${await response.text()}\`);
        }
        const data = await response.json();
        return data.image;
    } catch (error) {
        console.error("Error generating image:", error);
        logError(error as Error, { prompt });
        throw new Error("Could not generate image.");
    }
};\n`;

if (!regex.test(content)) {
    console.error("Could not find generateImage block.");
    process.exit(1);
}

content = content.replace(regex, replacement);
fs.writeFileSync('src/services/geminiService.ts', content);
