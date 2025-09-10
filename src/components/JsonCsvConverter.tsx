import React, { useState, useMemo } from 'react';
import { JsonCsvConverterIcon } from './icons.tsx';

const exampleJson = `[
  {"id": 1, "name": "Alice", "role": "Engineer"},
  {"id": 2, "name": "Bob", "role": "Designer"}
]`;
const exampleCsv = `id,name,role
1,Alice,Engineer
2,Bob,Designer`;

// Basic JSON to CSV conversion
const jsonToCsv = (jsonString: string): string => {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data) || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','));
        return [headers.join(','), ...rows].join('\n');
    } catch {
        return 'Error: Invalid JSON Array';
    }
};

// Basic CSV to JSON conversion
const csvToJson = (csvString: string): string => {
    try {
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
                return obj;
            }, {} as Record<string, string>);
        });
        return JSON.stringify(data, null, 2);
    } catch {
        return 'Error: Invalid CSV format';
    }
};

export const JsonCsvConverter: React.FC = () => {
    const [jsonInput, setJsonInput] = useState(exampleJson);
    const [csvInput, setCsvInput] = useState(exampleCsv);
    const [direction, setDirection] = useState<'json-to-csv' | 'csv-to-json'>('json-to-csv');

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
        if (direction === 'json-to-csv') {
            setCsvInput(jsonToCsv(e.target.value));
        }
    };

    const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCsvInput(e.target.value);
        if (direction === 'csv-to-json') {
            setJsonInput(csvToJson(e.target.value));
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <JsonCsvConverterIcon />
                    <span className="ml-3">JSON &lt;&gt; CSV Converter</span>
                </h1>
                <p className="text-text-secondary mt-1">A simple utility to convert between JSON arrays and CSV.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">JSON</label>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={handleJsonChange}
                        onFocus={() => setDirection('json-to-csv')}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                 <div className="flex flex-col h-full">
                    <label htmlFor="csv-input" className="text-sm font-medium text-text-secondary mb-2">CSV</label>
                    <textarea
                        id="csv-input"
                        value={csvInput}
                        onChange={handleCsvChange}
                        onFocus={() => setDirection('csv-to-json')}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
            </div>
        </div>
    );
};