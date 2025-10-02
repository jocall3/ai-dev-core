// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useRef } from 'react';
import { EnvironmentVariableManagerIcon } from './icons.tsx';
import { downloadFile } from '../services/fileUtils.ts';

interface EnvVar {
    id: number;
    key: string;
    value: string;
}

const parseEnvFile = (content: string): EnvVar[] => {
    return content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map((line, index) => {
            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) return null;
            return {
                id: index,
                key: line.slice(0, eqIndex),
                value: line.slice(eqIndex + 1)
            };
        })
        .filter((v): v is EnvVar => v !== null);
};

const stringifyEnvFile = (vars: EnvVar[]): string => {
    return vars.map(v => `${v.key}=${v.value}`).join('\n');
};

export const EnvironmentVariableManager: React.FC = () => {
    const [vars, setVars] = useState<EnvVar[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setVars(parseEnvFile(content));
            };
            reader.readAsText(file);
        }
    };

    const updateVar = (id: number, field: 'key' | 'value', newValue: string) => {
        setVars(vars.map(v => v.id === id ? { ...v, [field]: newValue } : v));
    };

    const addVar = () => {
        setVars([...vars, { id: Date.now(), key: '', value: '' }]);
    };
    
    const deleteVar = (id: number) => {
        setVars(vars.filter(v => v.id !== id));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <EnvironmentVariableManagerIcon />
                    <span className="ml-3">Environment Variable Manager</span>
                </h1>
                <p className="text-text-secondary mt-1">Load, edit, and download .env files securely on your machine.</p>
            </header>
            <div className="flex gap-4 mb-4">
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex-1 py-2">Load .env File</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".env" className="hidden" />
                <button onClick={() => downloadFile(stringifyEnvFile(vars), '.env')} className="btn-primary flex-1 py-2" disabled={vars.length === 0}>Download .env File</button>
            </div>
            <div className="flex-grow bg-surface border border-border rounded-lg overflow-y-auto">
                <div className="p-4 space-y-2">
                    {vars.length > 0 ? vars.map(v => (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-background rounded">
                            <input type="text" value={v.key} onChange={e => updateVar(v.id, 'key', e.target.value)} placeholder="KEY" className="flex-1 p-1 font-mono text-sm border border-border rounded"/>
                            <span className="font-bold">=</span>
                            <input type="text" value={v.value} onChange={e => updateVar(v.id, 'value', e.target.value)} placeholder="VALUE" className="flex-1 p-1 font-mono text-sm border border-border rounded"/>
                            <button onClick={() => deleteVar(v.id)} className="text-red-500 hover:text-red-700 p-1">&times;</button>
                        </div>
                    )) : (
                        <div className="text-center text-text-secondary p-8">Load a .env file or add a new variable to start.</div>
                    )}
                </div>
            </div>
             <div className="mt-4 text-center">
                <button onClick={addVar} className="text-primary font-semibold text-sm">+ Add Variable</button>
            </div>
        </div>
    );
};