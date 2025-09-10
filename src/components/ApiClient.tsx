import React, { useState, useCallback } from 'react';
import { ApiClientIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
}

export const ApiClient: React.FC = () => {
    const [method, setMethod] = useState<Method>('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
    const [headers, setHeaders] = useState('Content-Type: application/json');
    const [body, setBody] = useState('');
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSend = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResponse(null);
        try {
            const headerObj = headers.split('\n').reduce((acc, line) => {
                const [key, value] = line.split(':');
                if (key && value) acc[key.trim()] = value.trim();
                return acc;
            }, {} as Record<string, string>);

            const fetchOptions: RequestInit = {
                method,
                headers: headerObj,
            };

            if (method !== 'GET' && body) {
                fetchOptions.body = body;
            }

            // Note: In a real browser environment, direct API calls might be blocked by CORS.
            // This component assumes the target API has CORS enabled or a proxy is used.
            const res = await fetch(url, fetchOptions);

            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            
            let responseBody: any;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseBody = await res.json();
            } else {
                responseBody = await res.text();
            }

            setResponse({
                status: res.status,
                headers: responseHeaders,
                body: responseBody
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [url, method, headers, body]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ApiClientIcon />
                    <span className="ml-3">API Client</span>
                </h1>
                <p className="text-text-secondary mt-1">Make HTTP requests to any API endpoint (Postman-lite).</p>
            </header>
            <div className="flex flex-col gap-4 flex-grow min-h-0">
                <div className="flex gap-2 items-center">
                    <select value={method} onChange={e => setMethod(e.target.value as Method)} className="p-2 bg-surface border border-border rounded-md">
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="flex-grow p-2 bg-surface border border-border rounded-md font-mono" placeholder="https://api.example.com/data"/>
                    <button onClick={handleSend} disabled={isLoading} className="btn-primary px-6 py-2">
                        {isLoading ? <LoadingSpinner/> : 'Send'}
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow min-h-0">
                    <div className="flex flex-col gap-2">
                        <div>
                            <label className="text-sm font-medium">Headers</label>
                            <textarea value={headers} onChange={e => setHeaders(e.target.value)} className="w-full mt-1 p-2 bg-surface border border-border rounded-md font-mono h-24 resize-y"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Body</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full mt-1 p-2 bg-surface border border-border rounded-md font-mono flex-grow resize-y" disabled={method === 'GET'}/>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Response</label>
                        <div className="flex-grow mt-1 p-2 bg-background border border-border rounded-md overflow-auto">
                            {isLoading && (
                                <div className="h-full flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            )}
                            {error && <div className="text-red-500 p-2">{error}</div>}
                            {response && (
                                <div>
                                    <p>Status: <span className={`font-bold ${response.status >= 200 && response.status < 300 ? 'text-green-500' : 'text-red-500'}`}>{response.status}</span></p>
                                    <h4 className="font-bold mt-2">Headers</h4>
                                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(response.headers, null, 2)}</pre>
                                    <h4 className="font-bold mt-2">Body</h4>
                                    <pre className="text-xs whitespace-pre-wrap">{typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)}</pre>
                                </div>
                            )}
                             {!isLoading && !response && !error && (
                                <div className="text-text-secondary h-full flex items-center justify-center">
                                    Response will appear here.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};