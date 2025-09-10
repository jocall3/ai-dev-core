import React, { useState, useMemo } from 'react';
import { HtmlTableGeneratorIcon } from './icons.tsx';

const exampleCsv = `ID,Name,Role
1,Alice,Engineer
2,Bob,Designer
3,Charlie,Manager`;

const parseCsv = (csv: string): string[][] => {
    return csv.split('\n').map(row => row.split(',').map(cell => cell.trim()));
};

const generateHtmlTable = (data: string[][]): string => {
    if (data.length === 0 || (data.length === 1 && data[0].length === 0)) return '<!-- No data to display -->';

    const header = data[0];
    const rows = data.slice(1);

    const thead = `  <thead>\n    <tr>\n${header.map(h => `      <th>${h}</th>`).join('\n')}\n    </tr>\n  </thead>`;
    const tbody = `  <tbody>\n${rows.map(row => `    <tr>\n${row.map(cell => `      <td>${cell}</td>`).join('\n')}\n    </tr>`).join('\n')}\n  </tbody>`;

    return `<table>\n${thead}\n${tbody}\n</table>`;
};

export const HtmlTableGenerator: React.FC = () => {
    const [csv, setCsv] = useState(exampleCsv);
    const tableData = useMemo(() => parseCsv(csv), [csv]);
    const htmlOutput = useMemo(() => generateHtmlTable(tableData), [tableData]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <HtmlTableGeneratorIcon />
                    <span className="ml-3">HTML Table Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste CSV data to generate a clean HTML table.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="csv-input" className="text-sm font-medium text-text-secondary mb-2">CSV Data</label>
                    <textarea
                        id="csv-input"
                        value={csv}
                        onChange={(e) => setCsv(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">Generated HTML</label>
                        <button onClick={() => navigator.clipboard.writeText(htmlOutput)} className="px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy HTML</button>
                    </div>
                    <pre className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto text-sm">
                        <code>{htmlOutput}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};