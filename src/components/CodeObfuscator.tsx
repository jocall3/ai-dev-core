import React, { useState, useCallback } from 'react';
import { CodeObfuscatorIcon } from './icons.tsx';

// Basic, non-AI obfuscation logic
const obfuscateCode = (code: string): string => {
    let varCounter = 0;
    const varMap: { [key: string]: string } = {};
    const generateVarName = () => `_0x${(varCounter++).toString(16)}`;

    // Simple variable renaming (let, const, var, function parameters)
    let obfuscated = code.replace(/\b(let|const|var)\s+([a-zA-Z0-9_]+)/g, (_, keyword, varName) => {
        if (!varMap[varName]) {
            varMap[varName] = generateVarName();
        }
        return `${keyword} ${varMap[varName]}`;
    });

    // Replace variable usage
    for (const originalName in varMap) {
        obfuscated = obfuscated.replace(new RegExp(`\\b${originalName}\\b`, 'g'), varMap[originalName]);
    }
    
    // String to hex escape sequence
    obfuscated = obfuscated.replace(/"([^"]*)"/g, (_, str) => {
        return '"' + Array.from(str).map(char => '\\x' + (char as string).charCodeAt(0).toString(16).padStart(2, '0')).join('') + '"';
    });
    
     obfuscated = obfuscated.replace(/'([^']*)'/g, (_, str) => {
        return "'" + Array.from(str).map(char => '\\x' + (char as string).charCodeAt(0).toString(16).padStart(2, '0')).join('') + "'";
    });

    return obfuscated;
};


export const CodeObfuscator: React.FC = () => {
    const [inputCode, setInputCode] = useState('function greet(name) {\n  const message = "Hello, " + name;\n  console.log(message);\n}');
    const [outputCode, setOutputCode] = useState('');

    const handleObfuscate = useCallback(() => {
        if (!inputCode.trim()) {
            setOutputCode('');
            return;
        }
        const result = obfuscateCode(inputCode);
        setOutputCode(result);
    }, [inputCode]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeObfuscatorIcon />
                    <span className="ml-3">Code Obfuscator</span>
                </h1>
                <p className="text-text-secondary mt-1">Make your JavaScript code harder to read (Note: this is a simple, non-AI obfuscator).</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="input-code" className="text-sm font-medium text-text-secondary mb-2">Original Code</label>
                    <textarea
                        id="input-code"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Obfuscated Code</label>
                    <div className="relative flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{outputCode}</pre>
                         {!outputCode && <div className="text-text-secondary h-full flex items-center justify-center">Obfuscated code will appear here.</div>}
                    </div>
                </div>
            </div>
             <div className="flex-shrink-0 flex items-center justify-center mt-6">
                <button onClick={handleObfuscate} className="btn-primary px-8 py-3">Obfuscate</button>
            </div>
        </div>
    );
};